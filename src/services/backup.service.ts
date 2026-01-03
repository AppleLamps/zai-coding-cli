import { promises as fs } from "node:fs";
import path from "node:path";

type BackupEntry = {
  content: string;
  timestamp: number;
  originalPath: string;
};

type BackupStack = BackupEntry[];

type BackupStats = {
  fileCount: number;
  totalSize: number;
  maxSize: number;
};

type BackupInfo = {
  count: number;
  timestamps: number[];
};

export class BackupService {
  private backups: Map<string, BackupStack> = new Map();
  private backupDir: string;
  private maxStackDepth = 10;
  private maxTotalSize = 50 * 1024 * 1024; // 50MB total
  private currentTotalSize = 0;
  private initialized = false;

  constructor(projectRoot: string) {
    this.backupDir = path.join(projectRoot, ".zai", "backups");
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      await this.loadPersistedBackups();
      this.initialized = true;
    } catch (error) {
      // If we can't create the backup dir, continue with in-memory only
      console.warn("Could not initialize backup directory, using in-memory backups only");
      this.initialized = true;
    }
  }

  /**
   * Backup a file before modification
   */
  async backup(filePath: string, content: string): Promise<void> {
    await this.initialize();

    const contentSize = Buffer.byteLength(content, "utf8");

    // Check size limit for single file (5MB)
    if (contentSize > 5 * 1024 * 1024) {
      console.warn(`Skipping backup for ${filePath}: file too large`);
      return;
    }

    // Evict old backups if needed
    while (this.currentTotalSize + contentSize > this.maxTotalSize) {
      this.evictOldest();
    }

    const stack = this.backups.get(filePath) ?? [];

    // Limit stack depth per file
    if (stack.length >= this.maxStackDepth) {
      const removed = stack.shift();
      if (removed) {
        this.currentTotalSize -= Buffer.byteLength(removed.content, "utf8");
        await this.removePersistedBackup(filePath, removed.timestamp);
      }
    }

    const entry: BackupEntry = {
      content,
      timestamp: Date.now(),
      originalPath: filePath
    };

    stack.push(entry);
    this.backups.set(filePath, stack);
    this.currentTotalSize += contentSize;

    // Persist to disk
    await this.persistBackup(filePath, entry);
  }

  /**
   * Restore a file from backup (pops the most recent backup)
   */
  async restore(filePath: string): Promise<string | null> {
    await this.initialize();

    const stack = this.backups.get(filePath);
    if (!stack || stack.length === 0) {
      return null;
    }

    const entry = stack.pop()!;
    this.currentTotalSize -= Buffer.byteLength(entry.content, "utf8");

    if (stack.length === 0) {
      this.backups.delete(filePath);
    }

    // Remove from disk
    await this.removePersistedBackup(filePath, entry.timestamp);

    return entry.content;
  }

  /**
   * Get backup info for a specific file
   */
  getBackupInfo(filePath: string): BackupInfo | null {
    const stack = this.backups.get(filePath);
    if (!stack || stack.length === 0) return null;

    return {
      count: stack.length,
      timestamps: stack.map((e) => e.timestamp)
    };
  }

  /**
   * Get list of files that can be restored
   */
  getUndoableFiles(): string[] {
    return Array.from(this.backups.keys());
  }

  /**
   * Get backup statistics
   */
  getStats(): BackupStats {
    return {
      fileCount: this.backups.size,
      totalSize: this.currentTotalSize,
      maxSize: this.maxTotalSize
    };
  }

  /**
   * Clear all backups
   */
  async clearAll(): Promise<void> {
    this.backups.clear();
    this.currentTotalSize = 0;

    // Also clear disk
    try {
      await fs.rm(this.backupDir, { recursive: true, force: true });
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch {
      // Ignore errors
    }
  }

  /**
   * Restore all files (returns count of files restored)
   */
  async restoreAll(): Promise<number> {
    const files = this.getUndoableFiles();
    let count = 0;

    for (const file of files) {
      const content = await this.restore(file);
      if (content !== null) {
        count++;
      }
    }

    return count;
  }

  private evictOldest(): void {
    let oldestTime = Infinity;
    let oldestFile = "";

    for (const [file, stack] of this.backups) {
      if (stack.length > 0 && stack[0].timestamp < oldestTime) {
        oldestTime = stack[0].timestamp;
        oldestFile = file;
      }
    }

    if (oldestFile) {
      const stack = this.backups.get(oldestFile)!;
      const removed = stack.shift();
      if (removed) {
        this.currentTotalSize -= Buffer.byteLength(removed.content, "utf8");
        this.removePersistedBackup(oldestFile, removed.timestamp).catch(() => {});
      }
      if (stack.length === 0) {
        this.backups.delete(oldestFile);
      }
    }
  }

  private async persistBackup(filePath: string, entry: BackupEntry): Promise<void> {
    try {
      const safeFileName = this.encodeFilePath(filePath);
      const backupPath = path.join(this.backupDir, `${safeFileName}.${entry.timestamp}.bak`);
      await fs.writeFile(backupPath, entry.content, "utf8");
    } catch {
      // Ignore persistence errors, keep in-memory backup
    }
  }

  private async removePersistedBackup(filePath: string, timestamp: number): Promise<void> {
    try {
      const safeFileName = this.encodeFilePath(filePath);
      const backupPath = path.join(this.backupDir, `${safeFileName}.${timestamp}.bak`);
      await fs.unlink(backupPath);
    } catch {
      // Ignore errors
    }
  }

  private async loadPersistedBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);

      for (const file of files) {
        if (!file.endsWith(".bak")) continue;

        const match = file.match(/^(.+)\.(\d+)\.bak$/);
        if (!match) continue;

        const [, safeName, timestampStr] = match;
        const originalPath = this.decodeFilePath(safeName);
        const timestamp = parseInt(timestampStr, 10);

        try {
          const content = await fs.readFile(
            path.join(this.backupDir, file),
            "utf8"
          );

          const stack = this.backups.get(originalPath) ?? [];
          stack.push({ content, timestamp, originalPath });
          stack.sort((a, b) => a.timestamp - b.timestamp);
          this.backups.set(originalPath, stack);
          this.currentTotalSize += Buffer.byteLength(content, "utf8");
        } catch {
          // Skip corrupted backup files
        }
      }
    } catch {
      // No existing backups
    }
  }

  /**
   * Encode file path for safe file naming
   */
  private encodeFilePath(filePath: string): string {
    return Buffer.from(filePath, "utf8").toString("base64url");
  }

  /**
   * Decode file path from encoded name
   */
  private decodeFilePath(encoded: string): string {
    return Buffer.from(encoded, "base64url").toString("utf8");
  }
}
