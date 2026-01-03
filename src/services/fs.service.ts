import { promises as fs } from "node:fs";
import * as fsSync from "node:fs";
import path from "node:path";
import ignoreModule, { type Ignore, type Options } from "ignore";
import { createTwoFilesPatch } from "diff";
import micromatch from "micromatch";
import { GlobPatternError } from "../core/errors.js";

type ListFilesArgs = {
  path?: string;
  recursive?: boolean;
};

type ReadFileArgs = {
  path?: string;
};

type WriteFileArgs = {
  path?: string;
  content?: string;
};

type FileEntry = {
  path: string;
  type: "file" | "dir" | "symlink" | "other";
};

export class FSService {
  private rootDir: string;

  constructor(rootDir = process.cwd()) {
    try {
      this.rootDir = fsSync.realpathSync(rootDir);
    } catch {
      this.rootDir = rootDir;
    }
  }

  async listFiles(args: ListFilesArgs): Promise<string> {
    const targetPath = await this.resolvePath(args.path ?? ".");
    const recursive = args.recursive ?? false;
    const entries: FileEntry[] = [];

    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      await this.collectEntries(targetPath, recursive, entries);
    } else if (stats.isFile()) {
      entries.push({ path: this.toRelative(targetPath), type: "file" });
    }

    return JSON.stringify({
      root: this.toRelative(targetPath),
      entries
    });
  }

  async readFile(args: ReadFileArgs): Promise<string> {
    const targetPath = await this.resolvePath(this.requirePath(args.path));
    const stats = await fs.stat(targetPath);
    if (!stats.isFile()) {
      throw new Error("read_file expects a file path.");
    }
    return fs.readFile(targetPath, "utf8");
  }

  async writeFile(args: WriteFileArgs): Promise<string> {
    const preview = await this.previewWriteFile(args);
    const targetPath = await this.resolvePath(this.requirePath(args.path));
    const content = this.requireContent(args.content);
    const dir = path.dirname(targetPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(targetPath, content, "utf8");

    return JSON.stringify({
      path: preview.path,
      bytes: preview.bytes,
      diff: preview.diff,
      written: true
    });
  }

  async previewWriteFile(args: WriteFileArgs) {
    const targetPath = await this.resolvePath(this.requirePath(args.path));
    const content = this.requireContent(args.content);
    const existing = await this.readFileIfExists(targetPath);
    const relativePath = this.toRelative(targetPath);
    const diff = createTwoFilesPatch(
      `a/${relativePath}`,
      `b/${relativePath}`,
      existing,
      content,
      "",
      ""
    );

    return {
      path: relativePath,
      bytes: Buffer.byteLength(content, "utf8"),
      diff,
      existed: existing.length > 0
    };
  }

  /**
   * Validate glob pattern for safety and correctness
   */
  private validateGlobPattern(pattern: string): void {
    // Check for empty pattern
    if (!pattern || !pattern.trim()) {
      throw new GlobPatternError("Glob pattern cannot be empty", pattern);
    }

    // Check for control characters
    const invalidChars = /[\x00-\x1f]/;
    if (invalidChars.test(pattern)) {
      throw new GlobPatternError("Invalid control characters in pattern", pattern);
    }

    // Check for unbalanced brackets
    const openBrackets = (pattern.match(/\[/g) || []).length;
    const closeBrackets = (pattern.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      throw new GlobPatternError("Unbalanced brackets in pattern", pattern);
    }

    // Check for unbalanced braces
    const openBraces = (pattern.match(/\{/g) || []).length;
    const closeBraces = (pattern.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      throw new GlobPatternError("Unbalanced braces in pattern", pattern);
    }
  }

  /**
   * Find files matching a glob pattern using micromatch
   */
  async globFiles(args: { pattern: string; path?: string }): Promise<string> {
    const pattern = args.pattern;

    // Validate pattern before use
    this.validateGlobPattern(pattern);

    const basePath = args.path
      ? await this.resolvePath(args.path)
      : this.rootDir;

    const ig = await this.buildIgnore();

    // Collect all files first
    const allFiles = await this.collectAllFiles(basePath, ig);

    // Convert to relative paths for matching
    const relativePaths = allFiles.map((f) => this.toRelative(f));

    // Use micromatch for proper glob matching
    const matchedRelative = micromatch(relativePaths, pattern, {
      dot: true,
      matchBase: !pattern.includes("/")
    });

    if (matchedRelative.length === 0) {
      return JSON.stringify({
        pattern,
        basePath: this.toRelative(basePath),
        matches: [],
        count: 0
      });
    }

    // Sort by modification time (newest first)
    const withStats = await Promise.all(
      matchedRelative.map(async (relPath) => {
        const fullPath = path.join(this.rootDir, relPath);
        try {
          const stats = await fs.stat(fullPath);
          return { path: relPath, mtime: stats.mtime.getTime() };
        } catch {
          return { path: relPath, mtime: 0 };
        }
      })
    );

    withStats.sort((a, b) => b.mtime - a.mtime);

    return JSON.stringify({
      pattern,
      basePath: this.toRelative(basePath),
      matches: withStats.map((f) => f.path),
      count: withStats.length
    });
  }

  /**
   * Collect all files in a directory (respecting ignore rules)
   */
  private async collectAllFiles(
    dir: string,
    ig: Ignore,
    maxFiles = 5000
  ): Promise<string[]> {
    const files: string[] = [];
    const stack = [dir];

    while (stack.length > 0 && files.length < maxFiles) {
      const current = stack.pop();
      if (!current) continue;

      try {
        const entries = await fs.readdir(current, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= maxFiles) break;

          const fullPath = path.join(current, entry.name);
          const relativePath = this.toRelative(fullPath);

          if (ig.ignores(relativePath)) continue;

          if (entry.isDirectory()) {
            // Don't ignore directories for traversal
            if (!ig.ignores(`${relativePath}/`)) {
              stack.push(fullPath);
            }
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    return files;
  }

  async generateFileTree(maxDepth = 3) {
    const ig = await this.buildIgnore();
    const fileCount = await this.countFiles(this.rootDir, ig, 501);
    if (fileCount > 500) {
      const summary = await this.generateSummaryTree(ig);
      return `${summary}\n[Note] Use list_files <dir> to see deeper.`;
    }

    const lines: string[] = [];
    await this.walkTree(this.rootDir, 0, maxDepth, lines, ig);
    return lines.join("\n");
  }

  private async resolvePath(inputPath: string) {
    const resolved = path.resolve(this.rootDir, inputPath);
    let current = resolved;
    let suffix = "";

    while (true) {
      try {
        const realBase = await fs.realpath(current);
        const realPath = suffix ? path.join(realBase, suffix) : realBase;
        const relative = path.relative(this.rootDir, realPath);

        if (relative === ".." || relative.startsWith(`..${path.sep}`)) {
          throw new Error("Access denied: Path is outside the project root.");
        }
        if (path.isAbsolute(relative)) {
          throw new Error("Access denied: Path is outside the project root.");
        }

        return realPath;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
        const parent = path.dirname(current);
        if (parent === current) {
          throw error;
        }
        const baseName = path.basename(current);
        suffix = suffix ? path.join(baseName, suffix) : baseName;
        current = parent;
      }
    }
  }

  private toRelative(targetPath: string) {
    const relative = path.relative(this.rootDir, targetPath) || ".";
    return relative.split(path.sep).join("/");
  }

  private async buildIgnore() {
    const ignoreFactory =
      typeof ignoreModule === "function"
        ? (ignoreModule as (options?: Options) => Ignore)
        : (ignoreModule as { default: (options?: Options) => Ignore }).default;
    const ig = ignoreFactory();
    ig.add([
      ".git/",
      "node_modules/",
      "dist/",
      "build/",
      "out/",
      "coverage/",
      "tmp/",
      "temp/",
      "logs/",
      "*.log"
    ]);

    const gitignorePath = path.join(this.rootDir, ".gitignore");
    const gitignore = await this.readTextIfExists(gitignorePath);
    if (gitignore) {
      ig.add(gitignore);
    }

    return ig;
  }

  private async walkTree(
    directory: string,
    currentDepth: number,
    maxDepth: number,
    lines: string[],
    ig: Ignore
  ) {
    if (currentDepth > maxDepth) {
      return;
    }

    const dirents = await fs.readdir(directory, { withFileTypes: true });
    dirents.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const dirent of dirents) {
      const fullPath = path.join(directory, dirent.name);
      const relative = this.toRelative(fullPath);
      const ignorePath = dirent.isDirectory() ? `${relative}/` : relative;
      if (ig.ignores(ignorePath)) {
        continue;
      }

      const indent = "  ".repeat(currentDepth);
      const suffix = dirent.isDirectory() ? "/" : "";
      lines.push(`${indent}${dirent.name}${suffix}`);

      if (dirent.isDirectory() && currentDepth < maxDepth) {
        await this.walkTree(fullPath, currentDepth + 1, maxDepth, lines, ig);
      }
    }
  }

  private async countFiles(directory: string, ig: Ignore, limit: number) {
    let count = 0;
    const stack = [directory];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      const dirents = await fs.readdir(current, { withFileTypes: true });
      for (const dirent of dirents) {
        const fullPath = path.join(current, dirent.name);
        const relative = this.toRelative(fullPath);
        const ignorePath = dirent.isDirectory() ? `${relative}/` : relative;
        if (ig.ignores(ignorePath)) {
          continue;
        }
        if (dirent.isDirectory()) {
          stack.push(fullPath);
        } else if (dirent.isFile()) {
          count += 1;
          if (count >= limit) {
            return count;
          }
        }
      }
    }

    return count;
  }

  private async generateSummaryTree(ig: Ignore) {
    const dirents = await fs.readdir(this.rootDir, { withFileTypes: true });
    dirents.sort((a, b) => a.name.localeCompare(b.name));
    const lines: string[] = [];

    for (const dirent of dirents) {
      const fullPath = path.join(this.rootDir, dirent.name);
      const relative = this.toRelative(fullPath);
      const ignorePath = dirent.isDirectory() ? `${relative}/` : relative;
      if (ig.ignores(ignorePath)) {
        continue;
      }
      const suffix = dirent.isDirectory() ? "/" : "";
      lines.push(`${dirent.name}${suffix}`);
    }

    return lines.join("\n");
  }

  private async collectEntries(
    directory: string,
    recursive: boolean,
    entries: FileEntry[]
  ) {
    const dirents = await fs.readdir(directory, { withFileTypes: true });

    for (const dirent of dirents) {
      const fullPath = path.join(directory, dirent.name);
      const type = dirent.isDirectory()
        ? "dir"
        : dirent.isFile()
          ? "file"
          : dirent.isSymbolicLink()
            ? "symlink"
            : "other";
      entries.push({ path: this.toRelative(fullPath), type });

      if (recursive && dirent.isDirectory()) {
        await this.collectEntries(fullPath, true, entries);
      }
    }
  }

  private requirePath(value: string | undefined) {
    if (!value || !value.trim()) {
      throw new Error("Missing required path.");
    }
    return value;
  }

  private requireContent(value: string | undefined) {
    if (typeof value !== "string") {
      throw new Error("Missing required content.");
    }
    return value;
  }

  private async readFileIfExists(targetPath: string) {
    try {
      const stats = await fs.stat(targetPath);
      if (!stats.isFile()) {
        return "";
      }
      return await fs.readFile(targetPath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return "";
      }
      throw error;
    }
  }

  private async readTextIfExists(targetPath: string) {
    try {
      return await fs.readFile(targetPath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return "";
      }
      throw error;
    }
  }
}
