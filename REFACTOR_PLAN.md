# Refactor Plan: Fix All Critical Issues

## Phase 1: Critical Security & Data Loss Fixes (P0)

### 1.1 Fix multi_edit Security Hole

**Problem:** `multi_edit` bypasses trust levels and backup system entirely.

**Files:** `src/agent.ts`

**Changes:**
```typescript
// In the tool execution loop, add handling for multi_edit BEFORE the tool is executed:

if (toolName === "multi_edit") {
  const edits = (args as { edits?: Array<{ path: string }> })?.edits ?? [];

  // Backup all files that will be edited
  for (const edit of edits) {
    if (edit.path) {
      await this.backupFile(edit.path);
    }
  }

  // Show preview and get approval if needed
  if (needsApproval) {
    const previews = await this.mcp.previewMultiEdit(
      args as { edits: Array<{ path: string; old_string: string; new_string: string }> }
    ).edits;

    this.ui.stopSpinner();
    this.ui.writeSectionHeader(`Multi-Edit: ${edits.length} files`);

    for (const preview of previews) {
      if (preview.error) {
        this.ui.writeError(`  ${preview.path}: ${preview.error}`);
      } else {
        this.ui.writeMuted(`  ${preview.path}:`);
        this.ui.writeDiff(preview.diff);
      }
    }

    this.ui.renderPermissionPanel("Apply Edits", `${edits.length} files`, "warn");

    const approved = await confirm({
      message: "Apply all edits?",
      default: false
    });

    if (!approved) {
      this.messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: "User denied multi-edit operation."
      });
      this.onToolEnd?.("User denied multi-edit.");
      continue;
    }
  }
}
```

---

### 1.2 Add glob_files to SAFE_TOOLS

**Problem:** `glob_files` is a read-only operation but requires approval in standard mode.

**Files:** `src/agent.ts`

**Changes:**
```typescript
const SAFE_TOOLS = new Set([
  "read_file",
  "list_files",
  "search_project",
  "web_search",
  "read_url",
  "glob_files"  // ADD THIS
]);
```

---

### 1.3 Add Runtime Validation for Tool Arguments

**Problem:** Unsafe type assertions can crash on malformed LLM output.

**Files:**
- `src/core/types.ts` (NEW FILE)
- `src/agent.ts`

**Step 1: Create shared types file**
```typescript
// src/core/types.ts
import { z } from "zod";

export type TrustLevel = "full" | "standard" | "paranoid";

export type ToolActionInfo = {
  toolName: string;
  target: string;
};

// Zod schemas for runtime validation
export const EditSchema = z.object({
  path: z.string(),
  old_string: z.string(),
  new_string: z.string()
});

export const MultiEditArgsSchema = z.object({
  edits: z.array(EditSchema)
});

export const GlobArgsSchema = z.object({
  pattern: z.string(),
  path: z.string().optional()
});

export const ReadFileArgsSchema = z.object({
  path: z.string()
});

export const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string()
});

export const RunCommandArgsSchema = z.object({
  command: z.string()
});

// Validation helper
export function validateToolArgs<T>(
  schema: z.ZodSchema<T>,
  args: unknown,
  toolName: string
): T {
  const result = schema.safeParse(args);
  if (!result.success) {
    throw new Error(`Invalid arguments for ${toolName}: ${result.error.message}`);
  }
  return result.data;
}
```

**Step 2: Use validation in agent**
```typescript
// In agent.ts tool execution:
import { validateToolArgs, MultiEditArgsSchema, GlobArgsSchema } from "./core/types.js";

// Before executing multi_edit:
const validatedArgs = validateToolArgs(MultiEditArgsSchema, args, "multi_edit");

// Before executing glob_files:
const validatedArgs = validateToolArgs(GlobArgsSchema, args, "glob_files");
```

---

## Phase 2: Architecture Improvements (P1)

### 2.1 Extract TrustLevel to Shared Types

**Problem:** Circular dependency - command.service.ts imports from agent.ts

**Files:**
- `src/core/types.ts` (already created in 1.3)
- `src/agent.ts`
- `src/services/command.service.ts`

**Changes:**
```typescript
// src/agent.ts - REMOVE this:
export type TrustLevel = "full" | "standard" | "paranoid";

// ADD this:
import { TrustLevel, ToolActionInfo } from "./core/types.js";

// src/services/command.service.ts - CHANGE this:
import type { TrustLevel } from "../agent.js";
// TO this:
import type { TrustLevel } from "../core/types.js";
```

---

### 2.2 Create ToolApprovalService

**Problem:** Tool approval logic is duplicated and scattered in Agent class.

**Files:** `src/services/tool-approval.service.ts` (NEW FILE)

```typescript
// src/services/tool-approval.service.ts
import type { TrustLevel } from "../core/types.js";
import type { TerminalUI } from "../ui/terminal.js";
import type { MCPService } from "./mcp.service.js";
import { confirm } from "@inquirer/prompts";

type ApprovalConfig = {
  toolName: string;
  args: unknown;
  trustLevel: TrustLevel;
};

type ApprovalResult = {
  approved: boolean;
  reason?: string;
};

const SAFE_TOOLS = new Set([
  "read_file", "list_files", "search_project",
  "web_search", "read_url", "glob_files"
]);

const ALWAYS_PROMPT_TOOLS = new Set<string>([]);

export class ToolApprovalService {
  constructor(
    private ui: TerminalUI,
    private mcp: MCPService
  ) {}

  requiresApproval(toolName: string, trustLevel: TrustLevel): boolean {
    if (ALWAYS_PROMPT_TOOLS.has(toolName)) return true;

    switch (trustLevel) {
      case "full": return false;
      case "paranoid": return true;
      case "standard":
      default:
        return !SAFE_TOOLS.has(toolName);
    }
  }

  async requestApproval(config: ApprovalConfig): Promise<ApprovalResult> {
    const { toolName, args } = config;

    switch (toolName) {
      case "run_command":
        return this.approveCommand(args);
      case "git_commit":
        return this.approveGitCommit(args);
      case "write_file":
        return this.approveWriteFile(args);
      case "edit_file":
        return this.approveEditFile(args);
      case "multi_edit":
        return this.approveMultiEdit(args);
      default:
        return { approved: true };
    }
  }

  private async approveCommand(args: unknown): Promise<ApprovalResult> {
    const command = this.extractArg(args, "command");
    this.ui.renderPermissionPanel("Run Command", command || "command", "danger");
    const approved = await confirm({ message: "Allow this command?", default: false });
    return { approved, reason: approved ? undefined : "User denied command execution." };
  }

  private async approveGitCommit(args: unknown): Promise<ApprovalResult> {
    const message = this.extractArg(args, "message");
    this.ui.renderPermissionPanel("Git Commit", message || "(message)", "warn");
    const approved = await confirm({ message: "Allow this git commit?", default: false });
    return { approved, reason: approved ? undefined : "User denied git commit." };
  }

  private async approveWriteFile(args: unknown): Promise<ApprovalResult> {
    const preview = await this.mcp.previewWriteFile(args as any);
    this.ui.writeDiff(preview.diff, "Proposed Edit");
    const target = this.extractArg(args, "path") || "file";
    this.ui.renderPermissionPanel("Apply Edit", target, "safe");
    const approved = await confirm({ message: "Apply this edit?", default: false });
    return { approved, reason: approved ? undefined : "User denied the operation." };
  }

  private async approveEditFile(args: unknown): Promise<ApprovalResult> {
    const preview = await this.mcp.previewEditFile(args as any);
    this.ui.writeDiff(preview.diff, "Proposed Edit");
    const target = this.extractArg(args, "path") || "file";
    this.ui.renderPermissionPanel("Apply Edit", target, "safe");
    const approved = await confirm({ message: "Apply this edit?", default: false });
    return { approved, reason: approved ? undefined : "User denied the operation." };
  }

  private async approveMultiEdit(args: unknown): Promise<ApprovalResult> {
    const edits = (args as any)?.edits ?? [];
    const previews = await this.mcp.previewMultiEdit(edits);

    this.ui.writeSectionHeader(`Multi-Edit: ${edits.length} files`);
    for (const preview of previews) {
      if (preview.error) {
        this.ui.writeError(`  ${preview.path}: ${preview.error}`);
      } else {
        this.ui.writeMuted(`  ${preview.path}:`);
        this.ui.writeDiff(preview.diff);
      }
    }

    this.ui.renderPermissionPanel("Apply Edits", `${edits.length} files`, "warn");
    const approved = await confirm({ message: "Apply all edits?", default: false });
    return { approved, reason: approved ? undefined : "User denied multi-edit." };
  }

  private extractArg(args: unknown, key: string): string {
    if (!args || typeof args !== "object") return "";
    const value = (args as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  }
}
```

---

### 2.3 Create BackupService with Persistence

**Problem:** Backups are in-memory only, lost on exit, single-level only.

**Files:** `src/services/backup.service.ts` (NEW FILE)

```typescript
// src/services/backup.service.ts
import { promises as fs } from "node:fs";
import path from "node:path";

type BackupEntry = {
  content: string;
  timestamp: number;
  originalPath: string;
};

type BackupStack = BackupEntry[];

export class BackupService {
  private backups: Map<string, BackupStack> = new Map();
  private backupDir: string;
  private maxStackDepth = 10;
  private maxTotalSize = 50 * 1024 * 1024; // 50MB total
  private currentTotalSize = 0;

  constructor(projectRoot: string) {
    this.backupDir = path.join(projectRoot, ".zai", "backups");
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
    await this.loadPersistedBackups();
  }

  async backup(filePath: string, content: string): Promise<void> {
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

  async restore(filePath: string): Promise<string | null> {
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

  getBackupInfo(filePath: string): { count: number; timestamps: number[] } | null {
    const stack = this.backups.get(filePath);
    if (!stack || stack.length === 0) return null;

    return {
      count: stack.length,
      timestamps: stack.map(e => e.timestamp)
    };
  }

  getUndoableFiles(): string[] {
    return Array.from(this.backups.keys());
  }

  getStats(): { fileCount: number; totalSize: number; maxSize: number } {
    return {
      fileCount: this.backups.size,
      totalSize: this.currentTotalSize,
      maxSize: this.maxTotalSize
    };
  }

  clearAll(): void {
    this.backups.clear();
    this.currentTotalSize = 0;
    // Also clear disk
    fs.rm(this.backupDir, { recursive: true, force: true }).catch(() => {});
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
      }
      if (stack.length === 0) {
        this.backups.delete(oldestFile);
      }
    }
  }

  private async persistBackup(filePath: string, entry: BackupEntry): Promise<void> {
    const safeFileName = filePath.replace(/[/\\]/g, "__");
    const backupPath = path.join(this.backupDir, `${safeFileName}.${entry.timestamp}.bak`);
    await fs.writeFile(backupPath, entry.content, "utf8");
  }

  private async removePersistedBackup(filePath: string, timestamp: number): Promise<void> {
    const safeFileName = filePath.replace(/[/\\]/g, "__");
    const backupPath = path.join(this.backupDir, `${safeFileName}.${timestamp}.bak`);
    await fs.unlink(backupPath).catch(() => {});
  }

  private async loadPersistedBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);

      for (const file of files) {
        if (!file.endsWith(".bak")) continue;

        const match = file.match(/^(.+)\.(\d+)\.bak$/);
        if (!match) continue;

        const [, safeName, timestampStr] = match;
        const originalPath = safeName.replace(/__/g, "/");
        const timestamp = parseInt(timestampStr, 10);

        const content = await fs.readFile(
          path.join(this.backupDir, file),
          "utf8"
        );

        const stack = this.backups.get(originalPath) ?? [];
        stack.push({ content, timestamp, originalPath });
        stack.sort((a, b) => a.timestamp - b.timestamp);
        this.backups.set(originalPath, stack);
        this.currentTotalSize += Buffer.byteLength(content, "utf8");
      }
    } catch {
      // No existing backups
    }
  }
}
```

---

### 2.4 Replace Callback Soup with EventEmitter

**Problem:** Passing callbacks creates tight coupling and is hard to extend.

**Files:**
- `src/agent.ts`
- `src/index.ts`

**Step 1: Create typed event emitter**
```typescript
// src/core/events.ts
import { EventEmitter } from "node:events";
import type { ToolActionInfo, TrustLevel } from "./types.js";

export interface AgentEvents {
  "tool:start": (message: string) => void;
  "tool:end": (summary: string) => void;
  "tool:action": (info: ToolActionInfo) => void;
  "tool:result": (result: string) => void;
  "thinking": (thought: string) => void;
  "trust:changed": (level: TrustLevel) => void;
  "backup:created": (filePath: string) => void;
  "backup:restored": (filePath: string) => void;
}

export class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof AgentEvents>(
    event: K,
    ...args: Parameters<AgentEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof AgentEvents>(
    event: K,
    listener: AgentEvents[K]
  ): this {
    return super.on(event, listener);
  }
}
```

**Step 2: Use in Agent**
```typescript
// src/agent.ts
import { TypedEventEmitter } from "./core/events.js";

export class Agent extends TypedEventEmitter {
  // Remove callback properties
  // Replace this.onToolAction?.(info) with this.emit("tool:action", info)
}
```

**Step 3: Wire up in index.ts**
```typescript
// src/index.ts
agent.on("tool:action", (info) => ui.writeToolAction(info.toolName, info.target));
agent.on("tool:result", (result) => ui.writeToolResult(result));
agent.on("thinking", (thought) => ui.writeThinking(thought));
```

---

## Phase 3: Quality Improvements (P2)

### 3.1 Use Proper Glob Library

**Problem:** Custom glob implementation is buggy and slow.

**Files:**
- `package.json`
- `src/services/fs.service.ts`

**Step 1: Install micromatch**
```bash
npm install micromatch
npm install -D @types/micromatch
```

**Step 2: Replace custom implementation**
```typescript
// src/services/fs.service.ts
import micromatch from "micromatch";

async globFiles(args: { pattern: string; path?: string }): Promise<string> {
  const basePath = args.path
    ? await this.resolvePath(args.path)
    : this.rootDir;

  const ig = await this.buildIgnore();
  const allFiles = await this.collectAllFiles(basePath, ig);

  // Use micromatch for proper glob matching
  const matches = micromatch(
    allFiles.map(f => this.toRelative(f)),
    args.pattern,
    { dot: true }
  );

  // Sort by modification time
  const withStats = await Promise.all(
    matches.map(async (relPath) => {
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
    pattern: args.pattern,
    basePath: this.toRelative(basePath),
    matches: withStats.map(f => f.path),
    count: withStats.length
  });
}

// Remove: walkGlob, matchGlob methods
```

---

### 3.2 Consistent Error Handling

**Problem:** Errors are handled inconsistently across the codebase.

**Files:** `src/core/errors.ts` (NEW FILE)

```typescript
// src/core/errors.ts

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = "AgentError";
  }
}

export class ToolError extends AgentError {
  constructor(
    message: string,
    public readonly toolName: string
  ) {
    super(message, "TOOL_ERROR", true);
    this.name = "ToolError";
  }
}

export class ValidationError extends AgentError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", true);
    this.name = "ValidationError";
  }
}

export class PermissionDeniedError extends AgentError {
  constructor(operation: string) {
    super(`User denied: ${operation}`, "PERMISSION_DENIED", true);
    this.name = "PermissionDeniedError";
  }
}

export class BackupError extends AgentError {
  constructor(message: string, public readonly filePath: string) {
    super(message, "BACKUP_ERROR", true);
    this.name = "BackupError";
  }
}

// Error formatting helper
export function formatError(error: unknown): string {
  if (error instanceof AgentError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

---

### 3.3 Remove Dead Code

**Problem:** `onThinking` callback is never called.

**Option A: Remove it**
```typescript
// Remove from AgentOptions, Agent class, index.ts
```

**Option B: Actually use it (preferred)**
```typescript
// In streamOnce(), detect thinking patterns:
if (content.includes("<thinking>") || content.includes("Let me")) {
  this.emit("thinking", content);
}

// Or add explicit thinking support with model that supports it
```

---

### 3.4 Validate Glob Pattern Input

**Problem:** Invalid patterns crash the regex.

**Files:** `src/services/fs.service.ts`

```typescript
// Add validation before glob execution
private validateGlobPattern(pattern: string): void {
  // Check for common issues
  const invalidChars = /[\x00-\x1f]/;
  if (invalidChars.test(pattern)) {
    throw new ValidationError(`Invalid characters in glob pattern: ${pattern}`);
  }

  // Check for unbalanced brackets
  const openBrackets = (pattern.match(/\[/g) || []).length;
  const closeBrackets = (pattern.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    throw new ValidationError(`Unbalanced brackets in glob pattern: ${pattern}`);
  }

  // Check for empty pattern
  if (!pattern.trim()) {
    throw new ValidationError("Glob pattern cannot be empty");
  }
}
```

---

## Phase 4: Polish (P3)

### 4.1 Consolidate Tool Metadata

**Problem:** Tool display info scattered across multiple switch statements.

**Files:** `src/core/tool-registry.ts` (NEW FILE)

```typescript
// src/core/tool-registry.ts

export type ToolMetadata = {
  displayName: string;
  safe: boolean;
  getTarget: (args: unknown) => string;
  getResult: (args: unknown, result: string) => string;
  getDescription: (args: unknown) => string;
};

const extractArg = (args: unknown, key: string): string => {
  if (!args || typeof args !== "object") return "";
  const value = (args as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

export const TOOL_REGISTRY: Record<string, ToolMetadata> = {
  read_file: {
    displayName: "Read",
    safe: true,
    getTarget: (args) => extractArg(args, "path") || "file",
    getResult: (_, result) => `Read ${result.split("\n").length} lines`,
    getDescription: (args) => `Reading ${extractArg(args, "path")}...`
  },
  write_file: {
    displayName: "Write",
    safe: false,
    getTarget: (args) => extractArg(args, "path") || "file",
    getResult: (args) => `Wrote ${extractArg(args, "path")}`,
    getDescription: (args) => `Writing ${extractArg(args, "path")}...`
  },
  edit_file: {
    displayName: "Edit",
    safe: false,
    getTarget: (args) => extractArg(args, "path") || "file",
    getResult: (args) => `Edited ${extractArg(args, "path")}`,
    getDescription: (args) => `Editing ${extractArg(args, "path")}...`
  },
  multi_edit: {
    displayName: "MultiEdit",
    safe: false,
    getTarget: (args) => {
      const edits = (args as any)?.edits ?? [];
      return `${edits.length} files`;
    },
    getResult: (_, result) => {
      const success = (result.match(/✓/g) || []).length;
      const fail = (result.match(/✗/g) || []).length;
      return fail > 0 ? `Edited ${success}, ${fail} failed` : `Edited ${success} files`;
    },
    getDescription: (args) => {
      const edits = (args as any)?.edits ?? [];
      return `Editing ${edits.length} files...`;
    }
  },
  run_command: {
    displayName: "Bash",
    safe: false,
    getTarget: (args) => extractArg(args, "command") || "command",
    getResult: (_, result) =>
      result.includes("Process exited with code 0") || !result.includes("Process exited")
        ? "Command completed" : "Command failed",
    getDescription: (args) => `Running "${extractArg(args, "command")}"...`
  },
  glob_files: {
    displayName: "Glob",
    safe: true,
    getTarget: (args) => extractArg(args, "pattern") || "pattern",
    getResult: (_, result) => {
      try {
        return `Found ${JSON.parse(result).count || 0} files`;
      } catch {
        return "Glob completed";
      }
    },
    getDescription: (args) => `Finding files matching ${extractArg(args, "pattern")}...`
  },
  list_files: {
    displayName: "List",
    safe: true,
    getTarget: (args) => extractArg(args, "path") || ".",
    getResult: (_, result) => `Found ${result.split("\n").filter(Boolean).length} items`,
    getDescription: (args) => `Listing ${extractArg(args, "path") || "."}...`
  },
  search_project: {
    displayName: "Grep",
    safe: true,
    getTarget: (args) => `"${extractArg(args, "pattern")}"`,
    getResult: (_, result) => {
      const count = result.split("\n").length;
      return count ? `Found ${count} matches` : "No matches found";
    },
    getDescription: (args) => `Searching for "${extractArg(args, "pattern")}"...`
  },
  git_commit: {
    displayName: "Bash",
    safe: false,
    getTarget: (args) => {
      const msg = extractArg(args, "message");
      return msg ? `git commit -m "${msg.slice(0, 50)}..."` : "git commit";
    },
    getResult: () => "Committed changes",
    getDescription: () => "Committing changes..."
  },
  web_search: {
    displayName: "WebSearch",
    safe: true,
    getTarget: (args) => `"${extractArg(args, "query")}"`,
    getResult: () => "Search completed",
    getDescription: () => "Searching web..."
  },
  read_url: {
    displayName: "WebFetch",
    safe: true,
    getTarget: (args) => extractArg(args, "url") || "url",
    getResult: (args) => {
      try {
        const host = new URL(extractArg(args, "url")).host;
        return `Read content from ${host}`;
      } catch {
        return "Read web content";
      }
    },
    getDescription: (args) => `Reading ${extractArg(args, "url")}...`
  }
};

// Helper to get metadata with fallback
export function getToolMetadata(toolName: string): ToolMetadata {
  return TOOL_REGISTRY[toolName] ?? {
    displayName: toolName,
    safe: false,
    getTarget: () => "",
    getResult: () => "Completed",
    getDescription: () => `Executing ${toolName}...`
  };
}
```

---

### 4.2 Replace Emoji with ASCII Fallbacks

**Problem:** Emoji rendering inconsistent across terminals.

**Files:** `src/ui/terminal.ts`

```typescript
// Add terminal capability detection
private supportsEmoji(): boolean {
  // Check common indicators
  const term = process.env.TERM || "";
  const termProgram = process.env.TERM_PROGRAM || "";

  // Most modern terminals support emoji
  if (termProgram.includes("iTerm") || termProgram.includes("Apple_Terminal")) {
    return true;
  }
  if (term.includes("256color") || term.includes("xterm")) {
    return true;
  }

  // Windows Terminal supports emoji
  if (process.env.WT_SESSION) {
    return true;
  }

  return false;
}

// Update writeThinking
writeThinking(thought: string) {
  const icon = this.supportsEmoji() ? "💭" : "[thinking]";
  const lines = thought.split("\n");
  for (const line of lines) {
    console.log(chalk.gray.italic(`  ${icon} ${line}`));
  }
}
```

---

### 4.3 Add /backup Command

**Problem:** No way to view or manage backups.

**Files:** `src/services/command.service.ts`

```typescript
case "/backup":
  if (!this.callbacks.getBackupStats || !this.callbacks.getBackupInfo) {
    return { status: "error", message: "Backup system not available." };
  }

  const subCmd = rest[0]?.toLowerCase();

  if (subCmd === "stats") {
    const stats = this.callbacks.getBackupStats();
    return {
      status: "info",
      lines: [
        `Backup Statistics:`,
        `  Files: ${stats.fileCount}`,
        `  Size: ${(stats.totalSize / 1024).toFixed(1)} KB / ${(stats.maxSize / 1024 / 1024).toFixed(0)} MB`,
      ]
    };
  }

  if (subCmd === "clear") {
    this.callbacks.clearBackups?.();
    return { status: "success", message: "All backups cleared." };
  }

  if (subCmd === "info" && rest[1]) {
    const info = this.callbacks.getBackupInfo(rest[1]);
    if (!info) {
      return { status: "error", message: `No backups for ${rest[1]}` };
    }
    return {
      status: "info",
      lines: [
        `Backups for ${rest[1]}:`,
        `  Count: ${info.count}`,
        `  Timestamps:`,
        ...info.timestamps.map(t => `    - ${new Date(t).toISOString()}`)
      ]
    };
  }

  return {
    status: "info",
    lines: [
      "/backup stats      Show backup statistics",
      "/backup info <path> Show backup info for file",
      "/backup clear      Clear all backups",
    ]
  };
```

---

## Phase 5: Testing

### 5.1 Add Unit Tests

**Files:** `src/__tests__/` directory

```
src/__tests__/
  backup.service.test.ts
  tool-approval.service.test.ts
  tool-registry.test.ts
  glob.test.ts
  types.test.ts
```

Example test:
```typescript
// src/__tests__/backup.service.test.ts
import { BackupService } from "../services/backup.service.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

describe("BackupService", () => {
  let service: BackupService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "backup-test-"));
    service = new BackupService(tempDir);
    await service.initialize();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("backup and restore single file", async () => {
    await service.backup("test.txt", "original content");
    const restored = await service.restore("test.txt");
    expect(restored).toBe("original content");
  });

  test("multi-level undo", async () => {
    await service.backup("test.txt", "v1");
    await service.backup("test.txt", "v2");
    await service.backup("test.txt", "v3");

    expect(await service.restore("test.txt")).toBe("v3");
    expect(await service.restore("test.txt")).toBe("v2");
    expect(await service.restore("test.txt")).toBe("v1");
    expect(await service.restore("test.txt")).toBeNull();
  });

  test("respects size limits", async () => {
    // Test eviction when size limit exceeded
  });

  test("persists to disk", async () => {
    await service.backup("test.txt", "persisted");

    // Create new service instance
    const service2 = new BackupService(tempDir);
    await service2.initialize();

    const restored = await service2.restore("test.txt");
    expect(restored).toBe("persisted");
  });
});
```

---

## Implementation Order

1. **Day 1 (P0):**
   - 1.1 Fix multi_edit security
   - 1.2 Add glob_files to SAFE_TOOLS
   - 1.3 Add runtime validation

2. **Day 2 (P1 Part 1):**
   - 2.1 Extract TrustLevel to shared types
   - 2.2 Create ToolApprovalService

3. **Day 3 (P1 Part 2):**
   - 2.3 Create BackupService with persistence
   - 2.4 Replace callbacks with EventEmitter

4. **Day 4 (P2):**
   - 3.1 Use micromatch for glob
   - 3.2 Consistent error handling
   - 3.3 Fix or remove onThinking
   - 3.4 Validate glob patterns

5. **Day 5 (P3):**
   - 4.1 Consolidate tool metadata
   - 4.2 ASCII emoji fallbacks
   - 4.3 Add /backup command

6. **Day 6 (Testing):**
   - 5.1 Write unit tests
   - Integration testing
   - Manual QA

---

## Success Criteria

After refactor:
- [ ] `multi_edit` respects trust levels and creates backups
- [ ] `glob_files` auto-approved in standard mode
- [ ] No circular dependencies
- [ ] Agent class < 500 lines
- [ ] All tool args validated at runtime
- [ ] Backups persist across sessions
- [ ] Multi-level undo works
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Grade: **A**
