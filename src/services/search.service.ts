import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export class SearchService {
  private rootDir: string;

  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
  }

  async search(pattern: string, caseSensitive = false): Promise<string> {
    if (!pattern.trim()) {
      throw new Error("Search pattern is required.");
    }

    if (await this.isGitRepo()) {
      const args = ["grep", "-n", "--no-color", "--full-name", "-I"];
      if (!caseSensitive) {
        args.push("-i");
      }
      args.push(pattern);
      return this.runCommand("git", args);
    }

    const args = ["-RIn", "-I"];
    if (!caseSensitive) {
      args.push("-i");
    }
    args.push(
      "--exclude-dir=node_modules",
      "--exclude-dir=.git",
      "--exclude-dir=dist",
      "--exclude-dir=build",
      "--exclude-dir=out",
      "--exclude-dir=coverage",
      pattern,
      "."
    );
    return this.runCommand("grep", args);
  }

  private async isGitRepo() {
    try {
      const stat = await fs.stat(path.join(this.rootDir, ".git"));
      return stat.isDirectory() || stat.isFile();
    } catch {
      return false;
    }
  }

  private runCommand(command: string, args: string[]) {
    return new Promise<string>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: this.rootDir,
        windowsHide: true
      });
      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => reject(error));
      child.on("close", (code) => {
        const output = stdout.trimEnd();
        if (output) {
          resolve(output);
          return;
        }
        const errOutput = stderr.trimEnd();
        if (!errOutput && code === 1) {
          resolve("");
          return;
        }
        resolve(errOutput || `Search exited with code ${code ?? "unknown"}.`);
      });
    });
  }
}
