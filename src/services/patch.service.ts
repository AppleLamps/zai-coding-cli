import type { FSService } from "./fs.service.js";

export class PatchService {
  private fsService: FSService;

  constructor(fsService: FSService) {
    this.fsService = fsService;
  }

  async previewEdit(filePath: string, oldString: string, newString: string) {
    if (!oldString) {
      throw new Error("Target text not found. Check whitespace/indentation.");
    }

    const content = await this.fsService.readFile({ path: filePath });
    const occurrences = content.split(oldString).length - 1;

    if (occurrences === 0) {
      throw new Error("Target text not found. Check whitespace/indentation.");
    }
    if (occurrences > 1) {
      throw new Error(
        `Target text is not unique (found ${occurrences} times). Provide more context to disambiguate.`
      );
    }

    const updated = content.replace(oldString, newString);
    return this.fsService.previewWriteFile({ path: filePath, content: updated });
  }

  async applyEdit(filePath: string, oldString: string, newString: string) {
    if (!oldString) {
      throw new Error("Target text not found. Check whitespace/indentation.");
    }

    const content = await this.fsService.readFile({ path: filePath });
    const occurrences = content.split(oldString).length - 1;

    if (occurrences === 0) {
      throw new Error("Target text not found. Check whitespace/indentation.");
    }
    if (occurrences > 1) {
      throw new Error(
        `Target text is not unique (found ${occurrences} times). Provide more context to disambiguate.`
      );
    }

    const updated = content.replace(oldString, newString);
    await this.fsService.writeFile({ path: filePath, content: updated });
  }
}
