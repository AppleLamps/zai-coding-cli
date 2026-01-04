import readline from "node:readline";
import chalk from "chalk";
import boxen from "boxen";
import { highlight } from "cli-highlight";
import ora, { type Ora } from "ora";
import wrapAnsi from "wrap-ansi";
import { modeManager } from "../core/modes.js";
import { getToolDisplayName } from "../core/tool-registry.js";

export type Verbosity = "minimal" | "normal" | "verbose";

type TerminalOptions = {
  verbosity?: Verbosity;
  useAsciiEmoji?: boolean;
};

type StatusBarState = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  limit: number;
  contextCount: number;
  mode: string;
  gitStatus?: string;
  memoryCondensed?: boolean;
  cost?: string;
};

type PanelTone = "danger" | "warn" | "safe" | "info";

type BoxOptions = {
  title?: string;
  borderColor: string;
};

/**
 * ASCII alternatives for emoji (for terminals that don't support emoji)
 */
const ASCII_EMOJI: Record<string, string> = {
  "⚡": "[*]",
  "⚠": "[!]",
  "✓": "[v]",
  "✗": "[x]",
  "→": "->",
  "•": "*",
  "└": "`-",
  "💭": "[?]"
};

/**
 * Replace emoji with ASCII equivalents
 */
function toAscii(text: string): string {
  let result = text;
  for (const [emoji, ascii] of Object.entries(ASCII_EMOJI)) {
    result = result.replaceAll(emoji, ascii);
  }
  return result;
}

export class TerminalUI {
  private rl: readline.Interface;
  private spinner: Ora | null = null;
  private verbosity: Verbosity;
  private useAsciiEmoji: boolean;
  private buffer = "";
  private isPrompting = false;
  private assistantActive = false;
  private pendingLine = "";
  private inCodeBlock = false;
  private codeFenceLang = "";
  private codeBuffer = "";
  private statusBarVisible = false;
  private statusBarText = "";
  private statusNotice = "";
  private statusNoticeTimer: NodeJS.Timeout | null = null;

  constructor(options: TerminalOptions = {}) {
    this.verbosity = options.verbosity ?? "normal";
    this.useAsciiEmoji = options.useAsciiEmoji ?? this.detectAsciiMode();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    readline.emitKeypressEvents(process.stdin, this.rl);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.on("keypress", (_chunk, key) => {
      if (key?.ctrl && key.name === "c") {
        process.stdout.write("\n");
        process.emit("SIGINT");
      }
    });
  }

  prompt() {
    this.stopSpinner();
    this.hideStatusBar();
    this.buffer = "";
    this.renderPrompt();
    this.isPrompting = true;

    return new Promise<string>((resolve) => {
      const onKeypress = (chunk: string, key: readline.Key) => {
        if (key?.ctrl && key.name === "c") {
          return;
        }
        if (this.isShiftTab(key, chunk)) {
          modeManager.toggle();
          this.renderPrompt();
          return;
        }

        if (key?.name === "return") {
          process.stdout.write("\n");
          process.stdin.off("keypress", onKeypress);
          const value = this.buffer;
          this.buffer = "";
          this.isPrompting = false;
          resolve(value);
          return;
        }

        if (key?.name === "backspace") {
          if (this.buffer.length > 0) {
            this.buffer = this.buffer.slice(0, -1);
            this.renderPrompt();
          }
          return;
        }

        if (key?.name === "tab" || key?.name === "escape") {
          return;
        }

        if (chunk) {
          this.buffer += chunk;
          this.renderPrompt();
        }
      };

      process.stdin.on("keypress", onKeypress);
    });
  }

  writeBanner(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.log(chalk.cyan(message));
  }

  beginAssistantResponse() {
    this.stopSpinner();
    this.hideStatusBar();
    this.assistantActive = true;
    this.pendingLine = "";
  }

  writeAssistantChunk(text: string) {
    if (!this.assistantActive) {
      this.beginAssistantResponse();
    }
    this.streamMarkdown(text);
  }

  endAssistantResponse() {
    if (!this.assistantActive) {
      return;
    }
    this.flushPendingLine();
    if (this.inCodeBlock && this.codeBuffer) {
      this.flushCodeBlock();
    }
    this.assistantActive = false;
  }

  writeError(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.error(chalk.red(message));
  }

  writeWarning(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.log(chalk.yellow(message));
  }

  writeSuccess(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.log(chalk.green(message));
  }

  writeInfo(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.log(chalk.blue(message));
  }

  writeMuted(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.log(chalk.gray(message));
  }

  startToolSpinner(message: string) {
    this.stopSpinner();
    this.hideStatusBar();
    if (this.verbosity === "verbose") {
      this.writeToolLog("start", message);
    }
    this.spinner = ora({ text: message }).start();
  }

  endToolSpinner(message: string) {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
    if (!message) {
      return;
    }
    if (this.verbosity === "minimal") {
      this.setStatusNotice(`\u2714 ${message}`);
      return;
    }
    this.writeToolLog("success", message);
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Display a tool action in Claude Code style: • ToolName target
   */
  writeToolAction(toolName: string, target: string) {
    this.stopSpinner();
    this.hideStatusBar();
    const displayName = this.formatToolName(toolName);
    const formattedName = chalk.bold(displayName);
    console.log(this.emit(`• ${formattedName} ${chalk.dim(target)}`));
  }

  /**
   * Display agent thinking/reasoning in a subtle way
   */
  writeThinking(thought: string) {
    this.stopSpinner();
    this.hideStatusBar();
    // Show thinking in italic gray with a thought bubble indicator
    const lines = thought.split("\n");
    for (const line of lines) {
      console.log(chalk.gray.italic(this.emit(`  💭 ${line}`)));
    }
  }

  /**
   * Display a section header
   */
  writeSectionHeader(title: string) {
    this.stopSpinner();
    this.hideStatusBar();
    console.log(chalk.cyan.bold(`\n─── ${title} ───`));
  }

  /**
   * Display a tool result in nested tree style: └ result
   */
  writeToolResult(result: string) {
    if (!result) return;
    this.hideStatusBar();
    console.log(chalk.dim(this.emit(`  └ ${result}`)));
  }

  /**
   * Display multiple lines of tool output in nested tree style
   */
  writeToolOutput(lines: string[], maxLines = 4) {
    if (!lines.length) return;
    this.hideStatusBar();
    const visible = lines.slice(0, maxLines);
    for (let i = 0; i < visible.length; i++) {
      const prefix = i === 0 ? "└" : " ";
      console.log(chalk.dim(this.emit(`  ${prefix} ${visible[i]}`)));
    }
    if (lines.length > maxLines) {
      console.log(chalk.dim(`    ... ${lines.length - maxLines} more lines`));
    }
  }

  /**
   * Format tool name to Claude Code style display name
   */
  formatToolName(name: string): string {
    return getToolDisplayName(name);
  }

  /**
   * Emit text, converting emoji to ASCII if needed
   */
  private emit(text: string): string {
    return this.useAsciiEmoji ? toAscii(text) : text;
  }

  /**
   * Detect if we should use ASCII mode (no emoji support)
   */
  private detectAsciiMode(): boolean {
    // Check TERM for known limited terminals
    const term = process.env.TERM ?? "";
    if (term === "dumb" || term === "linux") {
      return true;
    }
    // Check for explicit preference
    if (process.env.ZAI_ASCII === "1") {
      return true;
    }
    // Default to emoji support
    return false;
  }

  writeDiff(diff: string, _title = "Proposed Edit") {
    this.stopSpinner();
    this.hideStatusBar();
    const lines = diff.split(/\r?\n/);
    // Show fewer lines by default for compact display
    const previewLines = this.verbosity === "verbose" ? 20 : 10;
    const shouldTruncate = lines.length > previewLines;
    const visibleLines = shouldTruncate ? lines.slice(0, previewLines) : lines;

    // Render inline without box, just indented colored lines
    for (const line of visibleLines) {
      console.log(`  ${this.colorDiffLine(line)}`);
    }

    if (shouldTruncate) {
      const remaining = lines.length - previewLines;
      console.log(chalk.dim(`    Show full diff (${remaining} more lines)`));
    }
  }

  /**
   * Color a single diff line based on its prefix
   */
  private colorDiffLine(line: string): string {
    if (line.startsWith("diff ") || line.startsWith("index ")) {
      return chalk.gray(line);
    }
    if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      return chalk.cyan(line);
    }
    if (line.startsWith("@@")) {
      return chalk.magenta(line);
    }
    if (line.startsWith("+")) {
      return chalk.green(line);
    }
    if (line.startsWith("-")) {
      return chalk.red(line);
    }
    return line;
  }

  writeTokenUsage(
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    limit: number,
    contextCount: number,
    mode: string,
    gitStatus?: string,
    memoryCondensed = false,
    cost = "0.00"
  ) {
    this.stopSpinner();
    this.statusBarText = this.formatStatusBar({
      promptTokens,
      completionTokens,
      totalTokens,
      limit,
      contextCount,
      mode,
      gitStatus,
      memoryCondensed,
      cost
    });
    this.renderStatusBar();
  }

  writeCommandOutput(output: string, maxLines = 6) {
    this.stopSpinner();
    const trimmed = output.trimEnd();
    if (!trimmed) {
      return;
    }
    const isError = /Process exited with code|timed out|aborted/i.test(trimmed);
    if (this.verbosity === "minimal" && !isError) {
      return;
    }
    const lines = trimmed.split(/\r?\n/);
    const lineLimit = this.verbosity === "verbose" ? maxLines * 2 : maxLines;
    const charLimit = this.verbosity === "verbose" ? 4000 : 1200;

    // Take last N lines (most relevant for command output)
    let visible = lines.slice(-lineLimit);
    let content = visible.join("\n");
    let truncated = lines.length > lineLimit;

    if (content.length > charLimit) {
      content = content.slice(0, charLimit);
      truncated = true;
    }

    // Render in nested tree style
    const outputLines = content.split(/\r?\n/);
    for (let i = 0; i < outputLines.length; i++) {
      const prefix = i === 0 ? this.emit("└") : " ";
      console.log(chalk.dim(`  ${prefix} ${outputLines[i]}`));
    }

    if (truncated) {
      console.log(chalk.dim(`    ... (${lines.length - lineLimit} more lines)`));
    }
  }

  writeHistoryMessage(role: "user" | "assistant", content: string) {
    this.stopSpinner();
    this.hideStatusBar();
    const label = role === "user" ? "You" : "Assistant";
    const { text } = this.truncateLines(content.trim(), this.getHistoryLimit());
    const header = chalk.dim(label.toUpperCase());
    this.renderBox(text, { title: header, borderColor: "gray" });
  }

  renderPermissionPanel(title: string, body: string, tone: PanelTone) {
    this.stopSpinner();
    this.hideStatusBar();

    // Use inline format with warning indicator
    const icon =
      tone === "danger"
        ? chalk.red(this.emit("⚠"))
        : tone === "warn"
          ? chalk.yellow(this.emit("⚠"))
          : tone === "safe"
            ? chalk.green(this.emit("→"))
            : chalk.blue(this.emit("•"));

    const label =
      tone === "danger"
        ? chalk.red(title)
        : tone === "warn"
          ? chalk.yellow(title)
          : chalk.cyan(title);

    console.log(`  ${icon} ${label}: ${chalk.dim(body)}`);
  }

  setStatusNotice(message: string, ttlMs = 2200) {
    const hadStatus = Boolean(this.statusBarText);
    this.statusNotice = message;
    if (!hadStatus) {
      this.statusBarText = chalk.dim(this.statusNotice);
    }
    if (this.statusNoticeTimer) {
      clearTimeout(this.statusNoticeTimer);
    }
    this.statusNoticeTimer = setTimeout(() => {
      this.statusNotice = "";
      if (!hadStatus) {
        this.statusBarText = "";
        this.hideStatusBar();
        return;
      }
      this.renderStatusBar();
    }, ttlMs);
    this.renderStatusBar();
  }

  close() {
    this.stopSpinner();
    this.hideStatusBar();
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    this.rl.close();
  }

  private renderPrompt() {
    const mode = modeManager.getCurrent();
    const label = `[${mode}] > `;
    const coloredLabel = mode === "ACT" ? chalk.green(label) : chalk.blue(label);
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(`${coloredLabel}${this.buffer}`);
  }

  private isShiftTab(key: readline.Key | undefined, chunk: string) {
    if (chunk === "\u001b[Z") {
      return true;
    }
    if (!key) {
      return false;
    }
    return key.name === "tab" && key.shift === true;
  }

  private streamMarkdown(chunk: string) {
    this.pendingLine += chunk;
    let newlineIndex = this.pendingLine.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.pendingLine.slice(0, newlineIndex);
      this.pendingLine = this.pendingLine.slice(newlineIndex + 1);
      this.renderMarkdownLine(line);
      newlineIndex = this.pendingLine.indexOf("\n");
    }
  }

  private flushPendingLine() {
    if (!this.pendingLine) {
      return;
    }
    this.renderMarkdownLine(this.pendingLine);
    this.pendingLine = "";
  }

  private renderMarkdownLine(line: string) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (this.inCodeBlock) {
        this.flushCodeBlock();
        this.inCodeBlock = false;
        this.codeFenceLang = "";
        return;
      }
      this.inCodeBlock = true;
      this.codeFenceLang = trimmed.slice(3).trim();
      return;
    }

    if (this.inCodeBlock) {
      this.codeBuffer += line + "\n";
      return;
    }

    // Apply inline formatting then output
    let formatted = this.formatInlineMarkdown(line);

    // Headers - cyan and bold
    if (trimmed.startsWith("####")) {
      formatted = chalk.cyan(this.formatInlineMarkdown(line.replace(/^(\s*)####\s*/, "$1")));
    } else if (trimmed.startsWith("###")) {
      formatted = chalk.cyan.bold(this.formatInlineMarkdown(line.replace(/^(\s*)###\s*/, "$1")));
    } else if (trimmed.startsWith("##")) {
      formatted = chalk.cyan.bold(this.formatInlineMarkdown(line.replace(/^(\s*)##\s*/, "$1")));
    } else if (trimmed.startsWith("#")) {
      formatted = chalk.cyan.bold.underline(this.formatInlineMarkdown(line.replace(/^(\s*)#\s*/, "$1")));
    }
    // Blockquotes - gray italic
    else if (trimmed.startsWith(">")) {
      formatted = chalk.gray.italic(this.formatInlineMarkdown(line.replace(/^(\s*)>\s*/, "$1")));
    }
    // Horizontal rules
    else if (/^(\s*)[-*_]{3,}\s*$/.test(line)) {
      formatted = chalk.dim("─".repeat(Math.min(40, process.stdout.columns || 80)));
    }
    // Unordered lists - bullet with color
    else if (/^(\s*)[-*]\s+/.test(line)) {
      const match = line.match(/^(\s*)[-*]\s+(.*)$/);
      if (match) {
        const indent = match[1];
        const content = this.formatInlineMarkdown(match[2]);
        formatted = `${indent}${chalk.cyan("•")} ${content}`;
      }
    }
    // Ordered lists - number with color
    else if (/^(\s*)\d+\.\s+/.test(line)) {
      const match = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (match) {
        const indent = match[1];
        const num = match[2];
        const content = this.formatInlineMarkdown(match[3]);
        formatted = `${indent}${chalk.cyan(num + ".")} ${content}`;
      }
    }

    process.stdout.write(formatted + "\n");
  }

  /**
   * Format inline markdown: **bold**, *italic*, `code`, ~~strikethrough~~
   */
  private formatInlineMarkdown(text: string): string {
    // Inline code - must be done first to avoid formatting inside code
    text = text.replace(/`([^`]+)`/g, (_, code) => chalk.yellow(code));

    // Bold + italic (***text***)
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, (_, content) => chalk.bold.italic(content));

    // Bold (**text**)
    text = text.replace(/\*\*([^*]+)\*\*/g, (_, content) => chalk.bold(content));

    // Italic (*text*)
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, content) => chalk.italic(content));

    // Strikethrough (~~text~~)
    text = text.replace(/~~([^~]+)~~/g, (_, content) => chalk.strikethrough(content));

    return text;
  }

  private flushCodeBlock() {
    const code = this.codeBuffer.replace(/\n$/, "");
    if (!code) {
      this.codeBuffer = "";
      return;
    }
    const lines = code.split(/\r?\n/);
    const limit = this.getCodeBlockLimit();
    const charLimit = this.getCodeCharLimit();
    const visible = lines.slice(0, limit);
    let snippet = visible.join("\n");
    let truncated = lines.length > limit;
    if (snippet.length > charLimit) {
      snippet = snippet.slice(0, charLimit);
      truncated = true;
    }
    const highlighted = highlight(snippet, {
      language: this.codeFenceLang || undefined,
      ignoreIllegals: true
    });
    const indented = highlighted
      .split(/\r?\n/)
      .map((line) => `  ${line}`)
      .join("\n");
    process.stdout.write(indented + "\n");
    if (truncated) {
      const hidden = Math.max(0, lines.length - visible.length);
      const message = hidden
        ? `  [code block truncated: ${hidden} lines hidden]`
        : "  [code block truncated]";
      process.stdout.write(chalk.dim(message) + "\n");
    }
    this.codeBuffer = "";
  }

  private renderBox(content: string, options: BoxOptions) {
    const width = this.getContentWidth();
    const wrapped = wrapAnsi(content, width, { hard: true, trim: false });
    const boxed = boxen(wrapped, {
      padding: 1,
      borderStyle: "single",
      borderColor: options.borderColor,
      title: options.title,
      titleAlignment: "left"
    });
    console.log(boxed);
  }

  private formatStatusBar(state: StatusBarState) {
    const format = (value: number) => value.toLocaleString("en-US");
    const tokens = `${format(state.totalTokens)}/${format(state.limit)}`;
    const usageColor =
      state.totalTokens > 180_000
        ? chalk.red
        : state.totalTokens >= 100_000
          ? chalk.yellow
          : chalk.green;
    const parts = [
      usageColor(this.emit(`⚡ ${tokens}`)),
      chalk.dim(`in ${format(state.promptTokens)}`),
      chalk.dim(`out ${format(state.completionTokens)}`),
      chalk.dim(`$${state.cost ?? "0.00"}`),
      chalk.dim(`Context ${state.contextCount}`),
      chalk.dim(`Mode ${state.mode}`)
    ];
    if (state.gitStatus) {
      parts.push(chalk.dim(`Git ${state.gitStatus}`));
    }
    if (state.memoryCondensed) {
      parts.push(chalk.dim("Memory Condensed"));
    }
    if (this.statusNotice) {
      parts.push(chalk.dim(this.statusNotice));
    }
    return chalk.dim(parts.join("  "));
  }

  private renderStatusBar() {
    if (!this.statusBarText || this.isPrompting || this.assistantActive) {
      return;
    }
    if (this.statusBarVisible) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      process.stdout.write(this.statusBarText);
      return;
    }
    process.stdout.write(this.statusBarText);
    this.statusBarVisible = true;
  }

  private hideStatusBar() {
    if (!this.statusBarVisible) {
      return;
    }
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write("\r");
    this.statusBarVisible = false;
  }

  private getContentWidth() {
    const columns = process.stdout.columns ?? 100;
    const padding = 6;
    return Math.max(20, columns - padding);
  }

  private writeToolLog(
    state: "start" | "success" | "info" | "warn",
    message: string
  ) {
    if (this.verbosity === "minimal") {
      return;
    }
    if (this.verbosity === "normal" && state === "start") {
      return;
    }
    this.hideStatusBar();
    const icons = {
      start: chalk.cyan(this.emit("→")),
      success: chalk.green(this.emit("✓")),
      info: chalk.blue(this.emit("•")),
      warn: chalk.yellow("!")
    };
    const icon = icons[state] ?? icons.info;
    console.log(`${icon} ${message}`);
  }

  private getCodeBlockLimit() {
    if (this.verbosity === "minimal") {
      return 8;
    }
    if (this.verbosity === "verbose") {
      return 40;
    }
    return 20;
  }

  private getCodeCharLimit() {
    if (this.verbosity === "minimal") {
      return 800;
    }
    if (this.verbosity === "verbose") {
      return 4000;
    }
    return 2000;
  }

  private getDiffLimit() {
    if (this.verbosity === "minimal") {
      return 80;
    }
    if (this.verbosity === "verbose") {
      return 400;
    }
    return 160;
  }

  private getHistoryLimit() {
    if (this.verbosity === "minimal") {
      return 6;
    }
    if (this.verbosity === "verbose") {
      return 16;
    }
    return 10;
  }

  private truncateLines(text: string, maxLines: number) {
    const lines = text.split(/\r?\n/);
    if (lines.length <= maxLines) {
      return { text: text.trim(), truncated: false };
    }
    const visible = lines.slice(0, maxLines).join("\n");
    return {
      text: `${visible}\n${chalk.dim("... (content truncated)")}`,
      truncated: true
    };
  }
}
