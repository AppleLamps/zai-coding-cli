/**
 * Centralized tool metadata registry
 *
 * This consolidates all tool display information in one place,
 * eliminating scattered switch statements across the codebase.
 */

export type ToolMetadata = {
  /** Display name shown in UI (e.g., "Read", "Bash") */
  displayName: string;
  /** Whether the tool is safe to auto-approve in standard mode */
  safe: boolean;
  /** Extract the target/subject from tool args */
  getTarget: (args: unknown) => string;
  /** Generate a result summary from tool output */
  getResult: (args: unknown, result: string) => string;
  /** Generate a description of what the tool is doing */
  getDescription: (args: unknown) => string;
};

/**
 * Safely extract a string argument from tool args
 */
const extractArg = (args: unknown, key: string): string => {
  if (!args || typeof args !== "object") return "";
  const value = (args as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

/**
 * Safely extract the host from a URL
 */
const safeHost = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};

/**
 * Count lines in a string
 */
const countLines = (text: string): number => {
  return text.split("\n").length;
};

/**
 * Parse JSON safely, returning null on failure
 */
const tryParseJson = (text: string): unknown | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Tool metadata registry - single source of truth for tool info
 */
export const TOOL_REGISTRY: Record<string, ToolMetadata> = {
  read_file: {
    displayName: "Read",
    safe: true,
    getTarget: (args) => extractArg(args, "path") || "file",
    getResult: (_, result) => `Read ${countLines(result)} lines`,
    getDescription: (args) => `Reading ${extractArg(args, "path") || "file"}...`
  },

  write_file: {
    displayName: "Write",
    safe: false,
    getTarget: (args) => extractArg(args, "path") || "file",
    getResult: (args) => `Wrote ${extractArg(args, "path") || "file"}`,
    getDescription: (args) => `Writing ${extractArg(args, "path") || "file"}...`
  },

  edit_file: {
    displayName: "Edit",
    safe: false,
    getTarget: (args) => extractArg(args, "path") || "file",
    getResult: (args) => `Edited ${extractArg(args, "path") || "file"}`,
    getDescription: (args) => `Editing ${extractArg(args, "path") || "file"}...`
  },

  multi_edit: {
    displayName: "MultiEdit",
    safe: false,
    getTarget: (args) => {
      const edits = (args as { edits?: unknown[] })?.edits;
      const count = Array.isArray(edits) ? edits.length : 0;
      return `${count} files`;
    },
    getResult: (_, result) => {
      const successCount = (result.match(/✓/g) || []).length;
      const failCount = (result.match(/✗/g) || []).length;
      if (failCount > 0) {
        return `Edited ${successCount} files, ${failCount} failed`;
      }
      return `Edited ${successCount} files`;
    },
    getDescription: (args) => {
      const edits = (args as { edits?: unknown[] })?.edits;
      const count = Array.isArray(edits) ? edits.length : 0;
      return `Editing ${count} files...`;
    }
  },

  run_command: {
    displayName: "Bash",
    safe: false,
    getTarget: (args) => extractArg(args, "command") || "command",
    getResult: (_, result) => {
      if (result.includes("Process exited with code 0") || !result.includes("Process exited with code")) {
        return "Command completed";
      }
      return "Command failed";
    },
    getDescription: (args) => {
      const cmd = extractArg(args, "command");
      return cmd ? `Running "${cmd}"...` : "Running command...";
    }
  },

  glob_files: {
    displayName: "Glob",
    safe: true,
    getTarget: (args) => extractArg(args, "pattern") || "pattern",
    getResult: (_, result) => {
      const parsed = tryParseJson(result);
      if (parsed && typeof parsed === "object" && "count" in parsed) {
        return `Found ${(parsed as { count: number }).count} files`;
      }
      return "Glob completed";
    },
    getDescription: (args) => `Finding files matching ${extractArg(args, "pattern") || "pattern"}...`
  },

  list_files: {
    displayName: "List",
    safe: true,
    getTarget: (args) => extractArg(args, "path") || ".",
    getResult: (_, result) => {
      const lines = result.split("\n").filter(Boolean);
      return `Found ${lines.length} items`;
    },
    getDescription: (args) => `Listing ${extractArg(args, "path") || "."}...`
  },

  search_project: {
    displayName: "Grep",
    safe: true,
    getTarget: (args) => {
      const pattern = extractArg(args, "pattern");
      return pattern ? `"${pattern}"` : "pattern";
    },
    getResult: (_, result) => {
      const lines = result.trim().split("\n").filter(Boolean);
      return lines.length ? `Found ${lines.length} matches` : "No matches found";
    },
    getDescription: (args) => {
      const pattern = extractArg(args, "pattern");
      return pattern ? `Searching for "${pattern}"...` : "Searching project...";
    }
  },

  git_commit: {
    displayName: "Bash",
    safe: false,
    getTarget: (args) => {
      const msg = extractArg(args, "message");
      if (msg) {
        const truncated = msg.slice(0, 50);
        return `git commit -m "${truncated}${msg.length > 50 ? "..." : ""}"`;
      }
      return "git commit";
    },
    getResult: () => "Committed changes",
    getDescription: () => "Committing changes..."
  },

  web_search: {
    displayName: "WebSearch",
    safe: true,
    getTarget: (args) => {
      const query = extractArg(args, "query");
      return query ? `"${query}"` : "query";
    },
    getResult: (_, result) => {
      // Try to count URLs in result
      const urls = result.match(/https?:\/\/[^\s)]+/g) ?? [];
      return urls.length ? `Found ${urls.length} results` : "Search completed";
    },
    getDescription: () => "Searching web..."
  },

  read_url: {
    displayName: "WebFetch",
    safe: true,
    getTarget: (args) => extractArg(args, "url") || "url",
    getResult: (args) => {
      const url = extractArg(args, "url");
      const host = safeHost(url);
      return host ? `Read content from ${host}` : "Read web content";
    },
    getDescription: (args) => {
      const url = extractArg(args, "url");
      const host = safeHost(url);
      return host ? `Reading ${host}...` : "Reading web page...";
    }
  }
};

/**
 * Get metadata for a tool, with sensible defaults for unknown tools
 */
export function getToolMetadata(toolName: string): ToolMetadata {
  return TOOL_REGISTRY[toolName] ?? {
    displayName: toolName,
    safe: false,
    getTarget: () => "",
    getResult: () => "Completed",
    getDescription: () => `Executing ${toolName}...`
  };
}

/**
 * Get the display name for a tool
 */
export function getToolDisplayName(toolName: string): string {
  return getToolMetadata(toolName).displayName;
}

/**
 * Check if a tool is safe (read-only)
 */
export function isToolSafe(toolName: string): boolean {
  return getToolMetadata(toolName).safe;
}

/**
 * Get all safe tool names
 */
export function getSafeToolNames(): string[] {
  return Object.entries(TOOL_REGISTRY)
    .filter(([_, meta]) => meta.safe)
    .map(([name]) => name);
}
