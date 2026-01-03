import { confirm } from "@inquirer/prompts";
import type { TrustLevel } from "../core/types.js";
import type { TerminalUI } from "../ui/terminal.js";
import type { MCPService } from "./mcp.service.js";

type ApprovalResult = {
  approved: boolean;
  reason?: string;
};

// Tools that are safe to auto-approve in standard mode (read-only operations)
const SAFE_TOOLS = new Set([
  "read_file",
  "list_files",
  "search_project",
  "web_search",
  "read_url",
  "glob_files"
]);

// Tools that require approval even in full trust mode (destructive)
const ALWAYS_PROMPT_TOOLS = new Set<string>([
  // Currently empty, but could include "git_push", "delete_file" etc.
]);

export class ToolApprovalService {
  constructor(
    private ui: TerminalUI,
    private mcp: MCPService
  ) {}

  /**
   * Check if a tool requires user approval based on trust level
   */
  requiresApproval(toolName: string, trustLevel: TrustLevel): boolean {
    // Always prompt for destructive tools
    if (ALWAYS_PROMPT_TOOLS.has(toolName)) {
      return true;
    }

    switch (trustLevel) {
      case "full":
        return false;
      case "paranoid":
        return true;
      case "standard":
      default:
        return !SAFE_TOOLS.has(toolName);
    }
  }

  /**
   * Request user approval for a tool operation
   */
  async requestApproval(
    toolName: string,
    args: unknown
  ): Promise<ApprovalResult> {
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

    const approved = await confirm({
      message: "Allow this command?",
      default: false
    });

    return {
      approved,
      reason: approved ? undefined : "User denied command execution."
    };
  }

  private async approveGitCommit(args: unknown): Promise<ApprovalResult> {
    const message = this.extractArg(args, "message");
    this.ui.renderPermissionPanel("Git Commit", message || "(message)", "warn");

    const approved = await confirm({
      message: "Allow this git commit?",
      default: false
    });

    return {
      approved,
      reason: approved ? undefined : "User denied git commit."
    };
  }

  private async approveWriteFile(args: unknown): Promise<ApprovalResult> {
    const filePath = this.extractArg(args, "path");

    try {
      const preview = await this.mcp.previewWriteFile(
        args as { path?: string; content?: string }
      );
      this.ui.writeDiff(preview.diff, "Proposed Edit");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.ui.writeError(`Preview failed: ${message}`);
    }

    const target = filePath || "file";
    this.ui.renderPermissionPanel("Apply Edit", target, "safe");

    const approved = await confirm({
      message: "Apply this edit?",
      default: false
    });

    return {
      approved,
      reason: approved ? undefined : "User denied the operation."
    };
  }

  private async approveEditFile(args: unknown): Promise<ApprovalResult> {
    const filePath = this.extractArg(args, "path");

    try {
      const preview = await this.mcp.previewEditFile(
        args as { path?: string; old_string?: string; new_string?: string }
      );
      this.ui.writeDiff(preview.diff, "Proposed Edit");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.ui.writeError(`Preview failed: ${message}`);
    }

    const target = filePath || "file";
    this.ui.renderPermissionPanel("Apply Edit", target, "safe");

    const approved = await confirm({
      message: "Apply this edit?",
      default: false
    });

    return {
      approved,
      reason: approved ? undefined : "User denied the operation."
    };
  }

  private async approveMultiEdit(args: unknown): Promise<ApprovalResult> {
    const edits = (args as { edits?: unknown[] })?.edits ?? [];
    const editCount = Array.isArray(edits) ? edits.length : 0;

    if (editCount === 0) {
      return { approved: false, reason: "No edits to apply." };
    }

    try {
      const previews = await this.mcp.previewMultiEdit(
        edits as Array<{ path: string; old_string: string; new_string: string }>
      );

      this.ui.writeSectionHeader(`Multi-Edit: ${editCount} files`);

      for (const preview of previews) {
        if (preview.error) {
          this.ui.writeError(`  ${preview.path}: ${preview.error}`);
        } else {
          this.ui.writeMuted(`  ${preview.path}:`);
          this.ui.writeDiff(preview.diff);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.ui.writeError(`Preview failed: ${message}`);
    }

    this.ui.renderPermissionPanel("Apply Edits", `${editCount} files`, "warn");

    const approved = await confirm({
      message: "Apply all edits?",
      default: false
    });

    return {
      approved,
      reason: approved ? undefined : "User denied multi-edit operation."
    };
  }

  private extractArg(args: unknown, key: string): string {
    if (!args || typeof args !== "object") return "";
    const value = (args as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  }
}
