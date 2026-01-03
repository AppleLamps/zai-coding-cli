#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig, saveGlobalConfig } from "./core/config.js";
import { Logger } from "./core/logger.js";
import { Agent } from "./agent.js";
import { CommandService } from "./services/command.service.js";
import { CompactionService } from "./services/compaction.service.js";
import { ContextService } from "./services/context.service.js";
import { FSService } from "./services/fs.service.js";
import { GitService } from "./services/git.service.js";
import { LLMService } from "./services/llm.service.js";
import { MCPService } from "./services/mcp.service.js";
import { PatchService } from "./services/patch.service.js";
import { SearchService } from "./services/search.service.js";
import { SessionService } from "./services/session.service.js";
import { ShellService } from "./services/shell.service.js";
import { TerminalUI, type Verbosity } from "./ui/terminal.js";

const logger = new Logger();

type CliOptions = { system?: string; resume?: boolean; verbosity?: Verbosity };

const normalizeVerbosity = (value?: string): Verbosity => {
  if (value === "minimal" || value === "normal" || value === "verbose") {
    return value;
  }
  return "normal";
};

const main = async (options: CliOptions) => {
  const config = loadConfig();
  const llm = new LLMService(config);
  const fsService = new FSService();
  const gitService = new GitService();
  const searchService = new SearchService();
  const shellService = new ShellService();
  const patchService = new PatchService(fsService);
  const contextService = new ContextService(fsService);
  const commandService = new CommandService(contextService);
  const sessionService = new SessionService();
  const compactionService = new CompactionService(llm);
  const mcp = new MCPService(
    config,
    fsService,
    gitService,
    patchService,
    searchService,
    shellService
  );
  const verbosity = normalizeVerbosity(options.verbosity);
  const ui = new TerminalUI({ verbosity });
  const agent = new Agent(
    llm,
    ui,
    mcp,
    contextService,
    commandService,
    gitService,
    sessionService,
    compactionService,
    {
      systemPrompt: options.system,
      trustLevel: "standard",
      // Legacy callbacks (still used for spinner during long operations)
      onToolStart: (_message) => {
        // Spinner is now optional - tool action is shown via onToolAction
      },
      onToolEnd: (_summary) => {
        // Result is now shown via onToolResult
      },
      // New Claude Code style callbacks
      onToolAction: (info) => ui.writeToolAction(info.toolName, info.target),
      onToolResult: (result) => ui.writeToolResult(result),
      onThinking: (thought) => ui.writeThinking(thought)
    }
  );

  // Wire up command callbacks for /undo and /trust
  commandService.setCallbacks({
    getUndoableFiles: () => agent.getUndoableFiles(),
    undoFile: (path) => agent.undoFile(path),
    setTrustLevel: (level) => agent.setTrustLevel(level),
    getTrustLevel: () => agent.getTrustLevel()
  });

  process.on("SIGINT", () => {
    if (agent.isBusy()) {
      agent.cancelCurrent();
      return;
    }
    ui.writeWarning("Exiting...");
    process.exit(0);
  });

  if (options.resume && (await sessionService.sessionExists())) {
    ui.writeInfo("Welcome back. Restoring session...");
    const state = await sessionService.loadSession();
    if (state) {
      await agent.restoreSession(state);
      const recent = agent.getRecentHistory(2);
      for (const message of recent) {
        ui.writeHistoryMessage(message.role, message.content);
      }
    }
  } else if (!options.resume && (await sessionService.sessionExists())) {
    await sessionService.backupSession();
    await sessionService.clearSession();
  }

  await agent.run();
};

const program = new Command();

program
  .name("zai-coding-cli")
  .description("Terminal-based coding assistant for Z.AI Coding Plan")
  .option("--system <prompt>", "Override the system prompt")
  .option("-r, --resume", "Resume the previous session")
  .option(
    "--verbosity <level>",
    "Output verbosity: minimal | normal | verbose",
    "normal"
  )
  .action(async () => {
    try {
      await main(program.opts<CliOptions>());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Fatal error: ${message}`);
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Manage global configuration")
  .option("--set-key <key>", "Set the global API key")
  .action(async (options: { setKey?: string }) => {
    if (!options.setKey) {
      console.error("Missing --set-key <KEY>.");
      process.exitCode = 1;
      return;
    }
    await saveGlobalConfig(options.setKey);
    console.log("Saved API key to ~/.zai/config.json");
  });

const run = async () => {
  await program.parseAsync(process.argv);
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Fatal error: ${message}`);
  process.exit(1);
});
