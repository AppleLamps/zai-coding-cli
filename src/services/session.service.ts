import { promises as fs } from "node:fs";
import path from "node:path";
import type { Mode } from "../core/modes.js";

export type SessionState = {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  pinnedFiles: string[];
  mode: Mode;
};

export class SessionService {
  private sessionDir: string;
  private sessionPath: string;
  private backupPath: string;

  constructor(rootDir = process.cwd()) {
    this.sessionDir = path.join(rootDir, ".zai");
    this.sessionPath = path.join(this.sessionDir, "session.json");
    this.backupPath = path.join(this.sessionDir, "session.bak.json");
  }

  async saveSession(state: SessionState) {
    await fs.mkdir(this.sessionDir, { recursive: true });
    const payload = JSON.stringify(state, null, 2);
    await fs.writeFile(this.sessionPath, payload, "utf8");
  }

  async loadSession(): Promise<SessionState | null> {
    try {
      const raw = await fs.readFile(this.sessionPath, "utf8");
      const parsed = JSON.parse(raw) as SessionState;
      if (!parsed || !Array.isArray(parsed.history)) {
        return null;
      }
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async clearSession() {
    try {
      await fs.unlink(this.sessionPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async sessionExists() {
    try {
      await fs.stat(this.sessionPath);
      return true;
    } catch {
      return false;
    }
  }

  async backupSession() {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
      await fs.copyFile(this.sessionPath, this.backupPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
