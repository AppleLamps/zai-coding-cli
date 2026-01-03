import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export class ShellService {
  private timeoutMs: number;
  private currentWorkingDirectory: string;
  private environmentVariables: Record<string, string>;

  constructor(timeoutMs = 30_000) {
    this.timeoutMs = timeoutMs;
    this.currentWorkingDirectory = process.cwd();
    this.environmentVariables = {};
  }

  execute(command: string, signal?: AbortSignal): Promise<string> {
    const trimmed = command.trim();
    if (!trimmed) {
      return Promise.reject(new Error("Command is required."));
    }

    const cdResult = this.handleCd(trimmed);
    if (cdResult) {
      return Promise.resolve(cdResult);
    }

    const exportResult = this.handleExport(trimmed);
    if (exportResult) {
      return Promise.resolve(exportResult);
    }

    return new Promise((resolve, reject) => {
      const child = spawn(trimmed, {
        shell: true,
        cwd: this.currentWorkingDirectory,
        env: {
          ...process.env,
          ...this.environmentVariables
        },
        windowsHide: true
      });

      let stdout = "";
      let stderr = "";
      let outputBytes = 0;
      let truncated = false;
      const maxOutputBytes = 100 * 1024;
      const truncationNotice = "[... Output truncated (too large) ...]";

      const appendChunk = (current: string, chunkText: string) => {
        if (truncated) {
          return current;
        }
        const remaining = maxOutputBytes - outputBytes;
        if (remaining <= 0) {
          truncated = true;
          return current;
        }
        const chunkBytes = Buffer.byteLength(chunkText);
        if (chunkBytes <= remaining) {
          outputBytes += chunkBytes;
          return current + chunkText;
        }
        const slice = Buffer.from(chunkText).subarray(0, remaining).toString();
        outputBytes += remaining;
        truncated = true;
        return current + slice;
      };

      const combineFooter = (footer: string) => {
        const parts = [footer, truncated ? truncationNotice : ""].filter(
          Boolean
        );
        return parts.join("\n");
      };

      const handleAbort = () => {
        child.kill();
        resolve(
          this.combineOutput(
            stdout,
            stderr,
            combineFooter("Command aborted by user.")
          )
        );
      };
      if (signal) {
        if (signal.aborted) {
          handleAbort();
          return;
        }
        signal.addEventListener("abort", handleAbort, { once: true });
      }

      const timeout = setTimeout(() => {
        child.kill();
        resolve(
          this.combineOutput(
            stdout,
            stderr,
            combineFooter("Command timed out after 30s.")
          )
        );
      }, this.timeoutMs);

      child.stdout?.on("data", (chunk) => {
        stdout = appendChunk(stdout, chunk.toString());
      });

      child.stderr?.on("data", (chunk) => {
        stderr = appendChunk(stderr, chunk.toString());
      });

      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      child.on("close", (code, closeSignal) => {
        clearTimeout(timeout);
        if (signal) {
          signal.removeEventListener("abort", handleAbort);
        }
        let footer = "";
        if (closeSignal) {
          footer = `Process terminated by signal ${closeSignal}.`;
        } else if (code && code !== 0) {
          footer = `Process exited with code ${code}.`;
        }
        resolve(this.combineOutput(stdout, stderr, combineFooter(footer)));
      });
    });
  }

  private combineOutput(stdout: string, stderr: string, footer: string) {
    const chunks = [stdout.trimEnd(), stderr.trimEnd(), footer.trimEnd()].filter(
      (value) => value
    );
    if (chunks.length === 0) {
      return "Command completed with no output.";
    }
    return chunks.join("\n");
  }

  private handleCd(command: string) {
    const match = command.match(/^cd\s*(.*)$/i);
    if (!match) {
      return "";
    }
    const rawTarget = match[1]?.trim();
    const target = rawTarget ? this.stripQuotes(rawTarget) : os.homedir();
    const resolved = path.resolve(this.currentWorkingDirectory, target);
    try {
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) {
        return `Directory not found: ${resolved}`;
      }
    } catch {
      return `Directory not found: ${resolved}`;
    }
    this.currentWorkingDirectory = resolved;
    return `Changed directory to ${resolved}`;
  }

  private handleExport(command: string) {
    const match = command.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      return "";
    }
    const key = match[1];
    const value = this.stripQuotes(match[2] ?? "");
    this.environmentVariables[key] = value;
    return `Set ${key}`;
  }

  private stripQuotes(value: string) {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }
}
