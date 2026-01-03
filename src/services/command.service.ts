import type { ContextService } from "./context.service.js";
import type { TrustLevel } from "../core/types.js";

type CommandAction = "clear_history" | "reset_all" | "set_trust" | "undo_file" | "undo_all";
type CommandStatus = "success" | "error" | "info";

type CommandResult = {
  status: CommandStatus;
  message?: string;
  lines?: string[];
  action?: CommandAction;
  data?: unknown;
};

type BackupStats = {
  fileCount: number;
  totalSize: number;
  maxSize: number;
};

type BackupInfo = {
  count: number;
  timestamps: number[];
};

type CommandCallbacks = {
  getUndoableFiles?: () => string[];
  undoFile?: (path: string) => Promise<boolean>;
  undoAll?: () => Promise<number>;
  setTrustLevel?: (level: TrustLevel) => void;
  getTrustLevel?: () => TrustLevel;
  getBackupStats?: () => BackupStats;
  getBackupInfo?: (path: string) => BackupInfo | null;
  clearBackups?: () => Promise<void>;
};

export class CommandService {
  private contextService: ContextService;
  private callbacks: CommandCallbacks;

  constructor(contextService: ContextService, callbacks: CommandCallbacks = {}) {
    this.contextService = contextService;
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: CommandCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  isCommand(input: string) {
    return input.trim().startsWith("/");
  }

  async execute(input: string): Promise<CommandResult> {
    const trimmed = input.trim();
    const [command, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ").trim();

    switch (command.toLowerCase()) {
      case "/add":
        if (!arg) {
          return { status: "error", message: "Usage: /add <path>" };
        }
        try {
          const record = await this.contextService.addFile(arg);
          return {
            status: "success",
            message: `\u2714 Added ${record.path} (${record.lines} lines)`
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return { status: "error", message: `Failed to add ${arg}: ${message}` };
        }
      case "/drop":
        if (!arg) {
          return { status: "error", message: "Usage: /drop <path>" };
        }
        if (this.contextService.removeFile(arg)) {
          return { status: "success", message: `Removed ${arg}` };
        }
        return { status: "info", message: `${arg} was not pinned.` };
      case "/files": {
        const files = this.contextService.getFiles();
        if (files.length === 0) {
          return { status: "info", message: "No pinned files." };
        }
        const lines = files.map(
          (file) => `${file.path} (${file.lines} lines)`
        );
        return { status: "info", lines };
      }
      case "/clear":
        return {
          status: "success",
          message: "Chat history cleared.",
          action: "clear_history"
        };
      case "/reset":
        this.contextService.clear();
        return {
          status: "success",
          message: "Chat history and pinned files cleared.",
          action: "reset_all"
        };
      case "/undo":
        if (!this.callbacks.getUndoableFiles || !this.callbacks.undoFile) {
          return { status: "error", message: "Undo not available." };
        }
        if (arg) {
          // Undo specific file
          const success = await this.callbacks.undoFile(arg);
          if (success) {
            return { status: "success", message: `✓ Restored ${arg}` };
          }
          return { status: "error", message: `No backup found for ${arg}` };
        }
        // List undoable files
        const undoableFiles = this.callbacks.getUndoableFiles();
        if (undoableFiles.length === 0) {
          return { status: "info", message: "No files to undo." };
        }
        return {
          status: "info",
          lines: [
            "Files that can be undone:",
            ...undoableFiles.map((f) => `  ${f}`),
            "",
            "Usage: /undo <path> to restore a specific file"
          ]
        };
      case "/trust":
        if (!this.callbacks.setTrustLevel || !this.callbacks.getTrustLevel) {
          return { status: "error", message: "Trust levels not available." };
        }
        if (!arg) {
          const current = this.callbacks.getTrustLevel();
          return {
            status: "info",
            lines: [
              `Current trust level: ${current}`,
              "",
              "Available levels:",
              "  full     - Auto-approve all operations (dangerous)",
              "  standard - Auto-approve reads, prompt for writes (default)",
              "  paranoid - Prompt for all operations",
              "",
              "Usage: /trust <level>"
            ]
          };
        }
        const level = arg.toLowerCase();
        if (level !== "full" && level !== "standard" && level !== "paranoid") {
          return {
            status: "error",
            message: "Invalid trust level. Use: full, standard, or paranoid"
          };
        }
        this.callbacks.setTrustLevel(level as TrustLevel);
        return {
          status: "success",
          message: `Trust level set to: ${level}`
        };
      case "/backup": {
        if (!this.callbacks.getBackupStats) {
          return { status: "error", message: "Backup system not available." };
        }

        const subCmd = rest[0]?.toLowerCase();

        if (subCmd === "stats") {
          const stats = this.callbacks.getBackupStats();
          const sizeKB = (stats.totalSize / 1024).toFixed(1);
          const maxMB = (stats.maxSize / 1024 / 1024).toFixed(0);
          return {
            status: "info",
            lines: [
              "Backup Statistics:",
              `  Files: ${stats.fileCount}`,
              `  Size: ${sizeKB} KB / ${maxMB} MB`
            ]
          };
        }

        if (subCmd === "clear") {
          if (!this.callbacks.clearBackups) {
            return { status: "error", message: "Clear backups not available." };
          }
          await this.callbacks.clearBackups();
          return { status: "success", message: "All backups cleared." };
        }

        if (subCmd === "info" && rest[1]) {
          if (!this.callbacks.getBackupInfo) {
            return { status: "error", message: "Backup info not available." };
          }
          const info = this.callbacks.getBackupInfo(rest[1]);
          if (!info) {
            return { status: "error", message: `No backups for ${rest[1]}` };
          }
          return {
            status: "info",
            lines: [
              `Backups for ${rest[1]}:`,
              `  Count: ${info.count}`,
              "  Timestamps:",
              ...info.timestamps.map((t) => `    - ${new Date(t).toISOString()}`)
            ]
          };
        }

        return {
          status: "info",
          lines: [
            "/backup stats       Show backup statistics",
            "/backup info <path> Show backup info for file",
            "/backup clear       Clear all backups"
          ]
        };
      }
      case "/help":
        return {
          status: "info",
          lines: [
            "/add <path>   Pin a file into context",
            "/drop <path>  Unpin a file",
            "/files        List pinned files",
            "/clear        Clear chat history (keep context)",
            "/reset        Clear chat history and context",
            "/undo [path]  Undo file changes (list or restore)",
            "/trust [lvl]  Set trust level (full/standard/paranoid)",
            "/backup       Manage file backups",
            "/help         Show this help",
            "",
            "Tip: Shift+Tab toggles PLAN/ACT mode"
          ]
        };
      default:
        return { status: "error", message: "Unknown command. Try /help." };
    }
  }
}
