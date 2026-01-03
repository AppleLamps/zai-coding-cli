import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall
} from "openai/resources/chat/completions";
import { confirm } from "@inquirer/prompts";
import { modeManager } from "./core/modes.js";
import { SYSTEM_PROMPT } from "./core/prompts.js";
import type { CommandService } from "./services/command.service.js";
import type { ContextService } from "./services/context.service.js";
import type { GitService } from "./services/git.service.js";
import type { MCPService } from "./services/mcp.service.js";
import type { CompactionService } from "./services/compaction.service.js";
import {
  MAX_CONTEXT_TOKENS,
  SAFE_CONTEXT_LIMIT,
  type LLMService
} from "./services/llm.service.js";
import type { SessionService, SessionState } from "./services/session.service.js";
import type { TerminalUI } from "./ui/terminal.js";

type AgentOptions = {
  systemPrompt?: string;
  onToolStart?: (message: string) => void;
  onToolEnd?: (message: string) => void;
};

type FunctionToolCall = Extract<
  ChatCompletionMessageToolCall,
  { type: "function" }
>;

export class Agent {
  private llm: LLMService;
  private ui: TerminalUI;
  private mcp: MCPService;
  private contextService: ContextService;
  private commandService: CommandService;
  private gitService: GitService;
  private sessionService: SessionService;
  private compactionService: CompactionService;
  private messages: ChatCompletionMessageParam[];
  private onToolStart?: (message: string) => void;
  private onToolEnd?: (message: string) => void;
  private systemPromptOverride?: string;
  private isBusyFlag = false;
  private cancelRequested = false;
  private currentAbortController: AbortController | null = null;

  constructor(
    llm: LLMService,
    ui: TerminalUI,
    mcp: MCPService,
    contextService: ContextService,
    commandService: CommandService,
    gitService: GitService,
    sessionService: SessionService,
    compactionService: CompactionService,
    options: AgentOptions = {}
  ) {
    this.llm = llm;
    this.ui = ui;
    this.mcp = mcp;
    this.contextService = contextService;
    this.commandService = commandService;
    this.gitService = gitService;
    this.sessionService = sessionService;
    this.compactionService = compactionService;
    this.onToolStart = options.onToolStart;
    this.onToolEnd = options.onToolEnd;
    this.systemPromptOverride = options.systemPrompt;
    this.messages = [];
  }

  async run() {
    this.ui.writeBanner("Z.AI Coding Plan CLI. Type 'exit' to quit.");

    while (true) {
      const input = (await this.ui.prompt()).trim();
      if (!input) {
        continue;
      }
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        break;
      }

      this.isBusyFlag = true;
      this.cancelRequested = false;

      if (this.commandService.isCommand(input)) {
        const shouldSave = await this.handleCommand(input);
        if (shouldSave) {
          await this.saveSession();
        }
        this.isBusyFlag = false;
        continue;
      }

      const baseSystemPrompt = await this.composeSystemPrompt();
      await this.manageMemory(baseSystemPrompt);
      if (this.cancelRequested) {
        this.isBusyFlag = false;
        this.cancelRequested = false;
        this.ui.setStatusNotice("Operation cancelled by user.");
        continue;
      }
      const systemPrompt = await this.composeSystemPrompt();
      this.messages.push({ role: "user", content: input });

      try {
        const tools = this.mcp.getOpenAITools();
        let response = await this.streamOnce(systemPrompt, tools);
        if (response.aborted || this.cancelRequested) {
          this.cancelRequested = false;
          this.isBusyFlag = false;
          this.ui.setStatusNotice("Operation cancelled by user.");
          continue;
        }
        let toolRounds = 0;

        while (response.toolCalls.length > 0) {
          this.messages.push({
            role: "assistant",
            content: response.assistantReply || "",
            tool_calls: response.toolCalls
          });

          for (const toolCall of response.toolCalls) {
            const args = this.parseToolArguments(toolCall.function.arguments);
            const toolName = toolCall.function.name;
            const startMessage = this.describeToolStart(toolName, args);

            if (this.cancelRequested) {
              break;
            }

            if (toolName === "run_command") {
              this.ui.stopSpinner();
              const command = this.extractStringArg(args, "command");
              this.ui.renderPermissionPanel(
                "Run Command",
                command || "command",
                "danger"
              );
              const approved = await confirm({
                message: "Allow this command?",
                default: false
              });

              if (!approved) {
                this.messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: "User denied command execution."
                });
                this.onToolEnd?.("User denied command execution.");
                continue;
              }
            }

            if (toolName === "git_commit") {
              this.ui.stopSpinner();
              const message = this.extractStringArg(args, "message");
              this.ui.renderPermissionPanel(
                "Git Commit",
                message || "(message)",
                "warn"
              );
              const approved = await confirm({
                message: "Allow this git commit?",
                default: false
              });

              if (!approved) {
                this.messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: "User denied git commit."
                });
                this.onToolEnd?.("User denied git commit.");
                continue;
              }
            }

            if (toolName === "write_file") {
              const preview = await this.mcp.previewWriteFile(
                args as { path?: string; content?: string }
              );
              this.ui.stopSpinner();
              this.ui.writeDiff(preview.diff, "Proposed Edit");
              const target = this.extractStringArg(args, "path") || "file";
              this.ui.renderPermissionPanel("Apply Edit", target, "safe");

              const approved = await confirm({
                message: "Apply this edit?",
                default: false
              });

              if (!approved) {
                this.messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: "User denied the operation."
                });
                this.onToolEnd?.("User denied the operation.");
                continue;
              }
            }

            if (toolName === "edit_file") {
              const preview = await this.mcp.previewEditFile(
                args as {
                  path?: string;
                  old_string?: string;
                  new_string?: string;
                }
              );
              this.ui.stopSpinner();
              this.ui.writeDiff(preview.diff, "Proposed Edit");
              const target = this.extractStringArg(args, "path") || "file";
              this.ui.renderPermissionPanel("Apply Edit", target, "safe");

              const approved = await confirm({
                message: "Apply this edit?",
                default: false
              });

              if (!approved) {
                this.messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: "User denied the operation."
                });
                this.onToolEnd?.("User denied the operation.");
                continue;
              }
            }

            this.onToolStart?.(startMessage);

            let result = "";
            if (toolName === "run_command") {
              const controller = new AbortController();
              this.currentAbortController = controller;
              result = await this.mcp.executeTool(toolName, args, {
                signal: controller.signal
              });
              this.currentAbortController = null;
            } else {
              result = await this.mcp.executeTool(toolName, args);
            }
            const sanitizedResult =
              toolName === "search_project"
                ? this.truncateSearchResults(result)
                : result;
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: sanitizedResult
            });
            if (toolName === "run_command") {
              this.ui.writeCommandOutput(result);
            }
            const summary = this.summarizeToolResult(
              toolName,
              args,
              sanitizedResult
            );
            this.onToolEnd?.(summary);
          }

          toolRounds += 1;
          if (toolRounds >= 10) {
            this.ui.writeError("Tool loop limit reached.");
            break;
          }

          if (this.cancelRequested) {
            break;
          }
          response = await this.streamOnce(systemPrompt, tools);
          if (response.aborted || this.cancelRequested) {
            this.cancelRequested = false;
            this.isBusyFlag = false;
            this.ui.setStatusNotice("Operation cancelled by user.");
            break;
          }
        }

        if (this.cancelRequested) {
          this.cancelRequested = false;
          this.ui.setStatusNotice("Operation cancelled by user.");
          continue;
        }

        if (response.toolCalls.length === 0) {
          this.messages.push({
            role: "assistant",
            content: response.assistantReply
          });
          if (response.usage) {
            const gitStatus = await this.getGitStatusMarker();
            const stats = this.llm.getUsageStats();
            this.ui.writeTokenUsage(
              response.usage.promptTokens,
              response.usage.completionTokens,
              stats.used,
              stats.limit,
              this.contextService.getCount(),
              modeManager.getCurrent(),
              gitStatus,
              this.hasSummary()
            );
          }
        }
        await this.saveSession();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error); 
        this.ui.writeError(`Error: ${message}`);
      } finally {
        this.isBusyFlag = false;
        this.currentAbortController = null;
      }
    }

    this.ui.close();
  }

  private async streamOnce(
    systemPrompt: string,
    tools: ReturnType<MCPService["getOpenAITools"]>
  ) {
    if (this.cancelRequested) {
      return {
        assistantReply: "",
        toolCalls: [],
        usage: null,
        aborted: true,
      };
    }
    const controller = new AbortController();
    this.currentAbortController = controller;
    let stream;
    try {
      stream = await this.llm.streamChat(
        systemPrompt,
        this.messages,
        tools,
        controller.signal
      );
    } catch (error) {
      if (this.isAbortError(error)) {
        return {
          assistantReply: "",
          toolCalls: [],
          usage: null,
          aborted: true
        };
      }
      throw error;
    }
    const toolCalls = new Map<number, FunctionToolCall>();
    let assistantReply = "";
    let outputStarted = false;
    let usage:
      | { promptTokens: number; completionTokens: number; totalTokens: number } 
      | null = null;

    try {
      for await (const chunk of stream) {
        if (chunk.usage) {
          const promptTokens = chunk.usage.prompt_tokens ?? 0;
          const completionTokens = chunk.usage.completion_tokens ?? 0;
          const totalTokens = chunk.usage.total_tokens ?? promptTokens + completionTokens;
          usage = {
            promptTokens,
            completionTokens,
            totalTokens
          };
          this.llm.recordUsage(totalTokens);
        }
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content ?? "";
        if (content) {
          assistantReply += content;
          if (!outputStarted) {
            this.ui.beginAssistantResponse();
            outputStarted = true;
          }
          this.ui.writeAssistantChunk(content);
        }

        const deltaToolCalls = delta?.tool_calls ?? [];
        for (const toolCall of deltaToolCalls) {
          const index = toolCall.index ?? 0;
          if (toolCall.type && toolCall.type !== "function") {
            continue;
          }
          const existing = toolCalls.get(index) ?? {
            id: toolCall.id ?? `tool_${index}`,
            type: "function",
            function: {
              name: "",
              arguments: ""
            }
          };

          if (toolCall.id) {
            existing.id = toolCall.id;
          }
          if (toolCall.function?.name) {
            existing.function.name = toolCall.function.name;
          }
          if (toolCall.function?.arguments) {
            existing.function.arguments += toolCall.function.arguments;
          }

          toolCalls.set(index, existing);
        }
      }
    } catch (error) {
      if (this.isAbortError(error)) {
        if (outputStarted) {
          this.ui.endAssistantResponse();
        }
        return {
          assistantReply,
          toolCalls: [],
          usage,
          aborted: true
        };
      }
      throw error;
    } finally {
      this.currentAbortController = null;
    }

    if (outputStarted) {
      this.ui.endAssistantResponse();
    }

    return {
      assistantReply,
      toolCalls: Array.from(toolCalls.values()),
      usage,
      aborted: false
    };
  }

  private parseToolArguments(raw: string) {
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { _raw: raw, _parseError: message };
    }
  }

  private describeToolStart(name: string, args: unknown) {
    switch (name) {
      case "web_search":
        return "Executing web_search...";
      case "run_command": {
        const command = this.extractStringArg(args, "command");
        return command ? `Running "${command}"...` : "Running command...";
      }
      case "git_commit": {
        return "Committing changes...";
      }
      case "read_url": {
        const url = this.extractStringArg(args, "url");
        const host = url ? this.safeHost(url) : "";
        return host ? `Reading ${host}...` : "Reading web page...";
      }
      case "read_file": {
        const path = this.extractStringArg(args, "path");
        return path ? ` Reading ${path}...` : " Reading file...";
      }
      case "search_project": {
        const pattern = this.extractStringArg(args, "pattern");
        return pattern ? ` Searching for "${pattern}"...` : " Searching project...";
      }
      case "write_file": {
        const path = this.extractStringArg(args, "path");
        return path ? `Writing ${path}...` : "Writing file...";
      }
      case "edit_file": {
        const path = this.extractStringArg(args, "path");
        return path ? `Editing ${path}...` : "Editing file...";
      }
      case "list_files": {
        const path = this.extractStringArg(args, "path");
        return path ? `Listing ${path}...` : "Listing files...";
      }
      default:
        return `Executing ${name}...`;
    }
  }

  private summarizeToolResult(name: string, args: unknown, result: string) {
    switch (name) {
      case "web_search": {
        const count = this.countSearchResults(result);
        if (count !== null) {
          return `Found ${count} results.`;
        }
        return "Search completed.";
      }
      case "read_url": {
        const url = typeof (args as { url?: unknown })?.url === "string"
          ? (args as { url: string }).url
          : "url";
        const host = this.safeHost(url);
        return host
          ? `Read content from ${host}.`
          : "Read web content.";
      }
      case "read_file": {
        const path =
          this.extractStringArg(args, "path") || "file";
        return `Read ${path}.`;
      }
      case "write_file": {
        const path =
          this.extractStringArg(args, "path") || "file";
        return `Wrote ${path}.`;
      }
      case "edit_file": {
        const path =
          this.extractStringArg(args, "path") || "file";
        return `Edited ${path}.`;
      }
      case "git_commit": {
        return "Committed changes.";
      }
      case "run_command": {
        const command = this.extractStringArg(args, "command") || "command";
        return `Ran ${command}.`;
      }
      case "search_project": {
        const count = this.countSearchMatches(result);
        if (count !== null) {
          return `Found ${count} matches.`;
        }
        return "Search completed.";
      }
      case "list_files": {
        const target =
          this.extractStringArg(args, "path") || "directory";
        return `Listed files in ${target}.`;
      }
      default:
        return "Tool completed.";
    }
  }

  private countSearchResults(result: string): number | null {
    const parsed = this.tryParseJson(result);
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const candidates = [record.results, record.items, record.data];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate.length;
        }
      }
    }

    const urls = result.match(/https?:\/\/[^\s)]+/g) ?? [];
    if (urls.length === 0) {
      return null;
    }
    const normalized = new Set(
      urls.map((url) => url.replace(/[),.]+$/, ""))
    );
    return normalized.size;
  }

  private tryParseJson(value: string): unknown | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return null;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  private safeHost(url: string) {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  }

  private extractStringArg(args: unknown, key: string) {
    if (!args || typeof args !== "object") {
      return "";
    }
    const value = (args as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  }

  private truncateSearchResults(output: string, limit = 50) {
    const trimmed = output.trimEnd();
    if (!trimmed) {
      return output;
    }
    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    if (lines.length <= limit) {
      return output;
    }
    const total = lines.length;
    const head = lines.slice(0, limit).join("\n");
    this.ui.setStatusNotice(
      `Search returned ${total} results. Top ${limit} sent.`
    );
    return `${head}\n... (${total - limit} more results omitted)`;
  }

  private countSearchMatches(output: string) {
    const trimmed = output.trimEnd();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\r?\n/).length;
  }

  private async manageMemory(systemPrompt: string) {
    const baseEstimate = this.estimateTotalTokens(this.messages);
    const systemEstimate = this.estimateTokens(systemPrompt);
    const estimated = baseEstimate + systemEstimate;
    const stripThreshold = Math.floor(SAFE_CONTEXT_LIMIT * 0.8);
    const compactThreshold = Math.floor(SAFE_CONTEXT_LIMIT * 0.9);
    if (estimated <= stripThreshold) {
      this.llm.recordUsage(Math.min(estimated, MAX_CONTEXT_TOKENS));
      return;
    }

    const stripped = this.compactionService.stripToolOutputs(this.messages);
    if (stripped !== this.messages) {
      this.messages = stripped;
    }

    const strippedEstimate =
      this.estimateTotalTokens(this.messages) + systemEstimate;
    this.llm.recordUsage(Math.min(strippedEstimate, MAX_CONTEXT_TOKENS));
    if (strippedEstimate <= compactThreshold) {
      return;
    }

    let attempts = 0;
    while (attempts < 3) {
      this.ui.startToolSpinner(
        "⚡ Compressing memory (Summarizing context)..."
      );
      const controller = new AbortController();
      this.currentAbortController = controller;
      try {
        this.messages = await this.compactionService.compactHistory(
          this.messages,
          controller.signal
        );
        const compactedEstimate =
          this.estimateTotalTokens(this.messages) + systemEstimate;
        this.llm.recordUsage(Math.min(compactedEstimate, MAX_CONTEXT_TOKENS));
        if (compactedEstimate <= stripThreshold) {
          break;
        }
      } catch (error) {
        if (this.isAbortError(error)) {
          this.cancelRequested = true;
          break;
        }
        throw error;
      } finally {
        this.ui.endToolSpinner("Memory condensed.");
        this.currentAbortController = null;
      }
      attempts += 1;
    }
  }

  private hasSummary() {
    return this.messages.some(
      (message) =>
        message.role === "system" &&
        typeof message.content === "string" &&
        message.content.includes("<summary>")
    );
  }

  private buildMemoryStatus() {
    const stats = this.llm.getUsageStats();
    if (stats.used <= 0 || stats.percentage <= 50) {
      return "";
    }
    const used = stats.used.toLocaleString("en-US");
    const limit = stats.limit.toLocaleString("en-US");
    const percentage = Math.round(stats.percentage);
    return [
      "<memory_status>",
      `  Using ${used} of ${limit} tokens (${percentage}%).`,
      "  You are approaching the limit. Be concise.",
      "</memory_status>"
    ].join("\n");
  }

  private estimateTotalTokens(messages: ChatCompletionMessageParam[]) {
    return messages.reduce((sum, message) => sum + this.estimateMessageTokens(message), 0);
  }

  private estimateMessageTokens(message: ChatCompletionMessageParam) {
    const content = message.content;
    if (!content) {
      return 0;
    }
    if (typeof content === "string") {
      return this.estimateTokens(content);
    }
    if (Array.isArray(content)) {
      const text = content
        .map((item) => (typeof item === "object" && "text" in item ? String(item.text ?? "") : ""))
        .join("");
      return this.estimateTokens(text);
    }
    return this.estimateTokens(String(content));
  }

  private estimateTokens(text: string) {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private isAbortError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }
    return error.name === "AbortError";
  }

  private async composeSystemPrompt() {
    const modePrompt = modeManager.getSystemPrompt();
    const [projectStructure, context, gitSection] = await Promise.all([
      this.contextService.getProjectStructure(),
      Promise.resolve(this.contextService.getFormattedContext()),
      this.getGitStatusSection()
    ]);
    const memoryStatus = this.buildMemoryStatus();
    const identityBlock = [modePrompt, this.systemPromptOverride ?? SYSTEM_PROMPT]
      .filter(Boolean)
      .join("\n\n");
    if (this.systemPromptOverride) {
      return [
        memoryStatus,
        identityBlock,
        projectStructure,
        context,
        gitSection
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }
    if (SYSTEM_PROMPT) {
      return [
        memoryStatus,
        identityBlock,
        projectStructure,
        context,
        gitSection
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }
    return [memoryStatus, identityBlock, projectStructure, context, gitSection]
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  private async handleCommand(input: string) {
    const result = await this.commandService.execute(input);
    if (result.lines?.length) {
      for (const line of result.lines) {
        this.ui.writeInfo(line);
      }
    }
    if (result.message) {
      if (result.status === "success") {
        this.ui.writeSuccess(result.message);
      } else if (result.status === "error") {
        this.ui.writeError(result.message);
      } else {
        this.ui.writeInfo(result.message);
      }
    }

    if (result.action === "clear_history") {
      await this.resetHistory();
    }
    if (result.action === "reset_all") {
      await this.resetHistory();
      await this.sessionService.clearSession();
      return false;
    }
    return true;
  }

  private async resetHistory() {
    this.messages = [];
  }

  async restoreSession(state: SessionState) {
    if (state.mode) {
      modeManager.setCurrent(state.mode);
    }

    if (state.pinnedFiles?.length) {
      for (const path of state.pinnedFiles) {
        try {
          await this.contextService.addFile(path);
        } catch {
          continue;
        }
      }
    }

    this.messages = [...state.history];
  }

  getRecentHistory(count: number) {
    const history = this.messages.filter(
      (message) => message.role === "user" || message.role === "assistant"
    ) as Array<{ role: "user" | "assistant"; content: string }>;
    return history.slice(-count);
  }

  private async saveSession() {
    const history = this.messages.filter(
      (message) => message.role === "user" || message.role === "assistant"
    ) as Array<{ role: "user" | "assistant"; content: string }>;
    const state: SessionState = {
      history,
      pinnedFiles: this.contextService.getPinnedPaths(),
      mode: modeManager.getCurrent()
    };
    await this.sessionService.saveSession(state);
  }

  private async getGitStatusSection() {
    if (!(await this.gitService.isGitRepo())) {
      return "";
    }
    const status = await this.gitService.getStatus();
    const content = status.trim() ? status.trim() : "(clean)";
    return `=== GIT STATUS ===\n${content}`;
  }

  private async getGitStatusMarker() {
    if (!(await this.gitService.isGitRepo())) {
      return "";
    }
    const status = await this.gitService.getStatus();
    return status.trim() ? "*Modified" : "";
  }

  isBusy() {
    return this.isBusyFlag;
  }

  cancelCurrent() {
    this.cancelRequested = true;
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
  }
}
