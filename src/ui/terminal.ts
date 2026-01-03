import readline from "node:readline";
import chalk from "chalk";
import boxen from "boxen";
import { highlight } from "cli-highlight";
import ora, { type Ora } from "ora";
import wrapAnsi from "wrap-ansi";
import { modeManager } from "../core/modes.js";

export type Verbosity = "minimal" | "normal" | "verbose";

type TerminalOptions = {
  verbosity?: Verbosity;
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

export class TerminalUI {
  private rl: readline.Interface;
  private spinner: Ora | null = null;
  private verbosity: Verbosity;
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

  writeDiff(diff: string, title = "Proposed Edit") {
    this.stopSpinner();
    this.hideStatusBar();
    const lines = diff.split(/\r?\n/);
    const maxLines = this.getDiffLimit();
    const shouldTruncate = lines.length > maxLines;
    const visibleLines = shouldTruncate ? lines.slice(0, maxLines) : lines;
    const rendered = visibleLines
      .map((line) => {
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
      })
      .join("\n");
    const trailer = shouldTruncate
      ? `\n${chalk.dim(`... ${lines.length - maxLines} more lines hidden`)}` 
      : "";
    this.renderBox(`${rendered}${trailer}`, { title, borderColor: "cyan" });
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

  writeCommandOutput(output: string, maxLines = 4) {
    this.stopSpinner();
    const trimmed = output.trimEnd();
    if (!trimmed) {
      return;
    }
    const isError = /Process exited with code|timed out|aborted/i.test(trimmed);
    if (this.verbosity === "minimal") {
      return;
    }
    if (this.verbosity === "normal" && !isError) {
      return;
    }
    const lines = trimmed.split(/\r?\n/);
    const lineLimit = this.verbosity === "verbose" ? maxLines : Math.min(4, maxLines);
    const charLimit = this.verbosity === "verbose" ? 4000 : 1200;
    const visible = lines.slice(0, lineLimit);
    let content = visible.join("\n");
    let truncated = lines.length > lineLimit;
    if (content.length > charLimit) {
      content = content.slice(0, charLimit);
      truncated = true;
    }
    if (truncated) {
      content = `${content}\n... (output truncated)`;
    }
    this.renderBox(chalk.gray(content), {
      title: "Command Output",
      borderColor: "red"
    });
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
    const borderColor =
      tone === "danger"
        ? "red"
        : tone === "safe"
          ? "green"
          : tone === "warn"
            ? "yellow"
            : "blue";
    const content = chalk.yellow(body);
    this.renderBox(content, { title, borderColor });
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

    if (trimmed.startsWith("#")) {
      process.stdout.write(chalk.bold(line) + "\n");
      return;
    }
    if (trimmed.startsWith(">")) {
      process.stdout.write(chalk.gray(line) + "\n");
      return;
    }
    process.stdout.write(line + "\n");
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
      usageColor(`⚡ ${tokens}`),
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
      start: chalk.cyan("→"),
      success: chalk.green("✓"),
      info: chalk.blue("•"),
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
