import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

export class GitService {
  private rootDir: string;

  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
  }

  async isGitRepo() {
    try {
      const stat = await fs.stat(path.join(this.rootDir, ".git"));
      return stat.isDirectory() || stat.isFile();
    } catch {
      return false;
    }
  }

  async getStatus() {
    if (!(await this.isGitRepo())) {
      return "";
    }
    return this.runGit(["status", "--short"]);
  }

  async commit(message: string) {
    if (!message.trim()) {
      throw new Error("Commit message is required.");
    }
    return this.runGit(["commit", "-am", message]);
  }

  private runGit(args: string[]) {
    return new Promise<string>((resolve, reject) => {
      const child = spawn("git", args, {
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
        const output = [stdout.trimEnd(), stderr.trimEnd()]
          .filter(Boolean)
          .join("\n");
        if (code && code !== 0) {
          resolve(`${output}\nProcess exited with code ${code}.`.trim());
          return;
        }
        resolve(output || "Git command completed with no output.");
      });
    });
  }
}
