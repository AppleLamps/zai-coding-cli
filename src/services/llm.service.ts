import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from "openai/resources/chat/completions";
import type { Config } from "../core/config.js";

export const MAX_CONTEXT_TOKENS = 202_752;
export const SAFE_CONTEXT_LIMIT = 190_000;

export class LLMService {
  private client: OpenAI;
  private model: string;
  private lastUsage = 0;

  constructor(config: Config) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
    this.model = config.model;
  }

  streamChat(
    systemPrompt: string,
    history: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
    signal?: AbortSignal
  ) {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    return this.client.chat.completions.create(
      {
        model: this.model,
        tools,
        messages,
        stream: true,
        stream_options: {
          include_usage: true
        }
      },
      { signal }
    );
  }

  async completeChat(messages: ChatCompletionMessageParam[], signal?: AbortSignal) {
    const response = await this.client.chat.completions.create(
      {
        model: this.model,
        messages
      },
      { signal }
    );
    const totalTokens = response.usage?.total_tokens ?? 0;
    this.recordUsage(totalTokens);
    return response.choices[0]?.message?.content ?? "";
  }

  recordUsage(totalTokens?: number | null) {
    if (typeof totalTokens === "number" && totalTokens >= 0) {
      this.lastUsage = totalTokens;
    }
  }

  getUsageStats() {
    const used = this.lastUsage;
    const limit = MAX_CONTEXT_TOKENS;
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    return { used, limit, percentage };
  }
}
