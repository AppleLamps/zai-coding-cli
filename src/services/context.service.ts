import type { FSService } from "./fs.service.js";

type PinnedFile = {
  path: string;
  content: string;
  lines: number;
};

export class ContextService {
  private fsService: FSService;
  private pinnedFiles = new Map<string, PinnedFile>();

  constructor(fsService: FSService) {
    this.fsService = fsService;
  }

  async addFile(path: string) {
    const content = await this.fsService.readFile({ path });
    const lines = this.countLines(content);
    const record: PinnedFile = { path, content, lines };
    this.pinnedFiles.set(path, record);
    return record;
  }

  removeFile(path: string) {
    return this.pinnedFiles.delete(path);
  }

  clear() {
    this.pinnedFiles.clear();
  }

  getFiles() {
    return Array.from(this.pinnedFiles.values()).map(({ path, lines }) => ({
      path,
      lines
    }));
  }

  getPinnedPaths() {
    return Array.from(this.pinnedFiles.keys());
  }

  getCount() {
    return this.pinnedFiles.size;
  }

  async getProjectStructure(depth = 2) {
    try {
      const tree = await this.fsService.generateFileTree(depth);
      if (!tree) {
        return "";
      }
      return `=== PROJECT STRUCTURE ===\n${tree}`;
    } catch {
      return "";
    }
  }

  getFormattedContext() {
    if (this.pinnedFiles.size === 0) {
      return "";
    }

    const sections: string[] = ["=== FILE CONTEXT ==="];
    for (const entry of this.pinnedFiles.values()) {
      sections.push(`File: ${entry.path}\n${entry.content}`);
    }

    return sections.join("\n\n");
  }

  private countLines(content: string) {
    if (!content) {
      return 0;
    }
    return content.split(/\r?\n/).length;
  }
}
