import type { ContextService } from "./context.service.js";

type CommandAction = "clear_history" | "reset_all";
type CommandStatus = "success" | "error" | "info";

type CommandResult = {
  status: CommandStatus;
  message?: string;
  lines?: string[];
  action?: CommandAction;
};

export class CommandService {
  private contextService: ContextService;

  constructor(contextService: ContextService) {
    this.contextService = contextService;
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
      case "/help":
        return {
          status: "info",
          lines: [
            "/add <path>   Pin a file into context",
            "/drop <path>  Unpin a file",
            "/files        List pinned files",
            "/clear        Clear chat history (keep context)",
            "/reset        Clear chat history and context",
            "/help         Show this help",
            "Tip: Shift+Tab toggles PLAN/ACT mode",
            "CLI: my-agent config --set-key <KEY>"
          ]
        };
      default:
        return { status: "error", message: "Unknown command. Try /help." };
    }
  }
}
