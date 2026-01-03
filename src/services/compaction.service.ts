import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { LLMService } from "./llm.service.js";

const COMPACTION_PROMPT = `You are a technical documentation assistant.
Summarize the following conversation history into a structured update.
Include:
1. Task Overview (Original request & goals)
2. Current State (Completed steps, files modified)
3. Key Decisions & constraints discovered
4. Next Steps
Wrap your response in <summary> tags.`;

export class CompactionService {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  stripToolOutputs(history: ChatCompletionMessageParam[]) {
    let changed = false;
    const updated = history.map((message) => {
      if (message.role !== "tool") {
        return message;
      }
      if (typeof message.content !== "string") {
        return message;
      }
      if (message.content.length <= 1000) {
        return message;
      }
      changed = true;
      return {
        ...message,
        content: "[Output removed to save memory. See summary for details.]"
      };
    });
    return changed ? updated : history;
  }

  async compactHistory(history: ChatCompletionMessageParam[], signal?: AbortSignal) {
    if (history.length <= 2) {
      return history;
    }

    const splitIndex = Math.max(1, Math.floor(history.length / 2));
    const oldHistory = history.slice(0, splitIndex);
    const recentHistory = history.slice(splitIndex);
    const formatted = this.formatHistory(oldHistory);

    const summary = await this.requestSummary(formatted, signal);
    const summaryMessage: ChatCompletionMessageParam = {
      role: "system",
      content: this.ensureSummaryTags(summary)
    };

    return [summaryMessage, ...recentHistory];
  }

  private async requestSummary(content: string, signal?: AbortSignal) {
    const response = await this.llm.completeChat(
      [
        { role: "system", content: COMPACTION_PROMPT },
        { role: "user", content }
      ],
      signal
    );
    return response || "<summary>No summary available.</summary>";
  }

  private formatHistory(history: ChatCompletionMessageParam[]) {
    return history
      .map((message) => {
        const role = message.role.toUpperCase();
        const content = this.renderContent(message.content);
        return `${role}:\n${content}`;
      })
      .join("\n\n");
  }

  private renderContent(content: ChatCompletionMessageParam["content"]) {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) =>
          typeof item === "object" && item && "text" in item
            ? String(item.text ?? "")
            : ""
        )
        .join("");
    }
    if (content == null) {
      return "";
    }
    return String(content);
  }

  private ensureSummaryTags(summary: string) {
    const trimmed = summary.trim();
    if (trimmed.startsWith("<summary>") && trimmed.endsWith("</summary>")) {
      return trimmed;
    }
    return `<summary>\n${trimmed}\n</summary>`;
  }
}
