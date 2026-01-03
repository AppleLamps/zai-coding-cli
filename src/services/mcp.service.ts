import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { Config } from "../core/config.js";
import type { FSService } from "./fs.service.js";
import type { GitService } from "./git.service.js";
import type { PatchService } from "./patch.service.js";
import type { SearchService } from "./search.service.js";
import type { ShellService } from "./shell.service.js";

type MCPResponse = {
  result?: {
    content?: Array<{ type?: string; text?: string }>;
  };
  error?: {
    message?: string;
  };
};

export class MCPService {
  private apiKey: string;
  private searchEndpoint = "https://api.z.ai/api/mcp/web_search_prime/mcp";
  private readerEndpoint = "https://api.z.ai/api/mcp/web_reader/mcp";
  private fsService: FSService;
  private gitService: GitService;
  private patchService: PatchService;
  private searchService: SearchService;
  private shellService: ShellService;

  constructor(
    config: Config,
    fsService: FSService,
    gitService: GitService,
    patchService: PatchService,
    searchService: SearchService,
    shellService: ShellService
  ) {
    this.apiKey = config.apiKey;
    this.fsService = fsService;
    this.gitService = gitService;
    this.patchService = patchService;
    this.searchService = searchService;
    this.shellService = shellService;
  }

  getOpenAITools(): ChatCompletionTool[] {
    return [
      {
        type: "function",
        function: {
          name: "list_files",
          description: "List local files and folders.",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" },
              recursive: { type: "boolean" }
            },
            required: ["path"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_file",
          description: "Read a local file from disk.",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" }
            },
            required: ["path"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "write_file",
          description: "Write a local file to disk.",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" }
            },
            required: ["path", "content"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "edit_file",
          description:
            "Replaces a unique string in a file with new text. PREFERRED over write_file for existing files to save tokens. Ensure old_string is unique.",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" },
              old_string: { type: "string" },
              new_string: { type: "string" }
            },
            required: ["path", "old_string", "new_string"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "run_command",
          description:
            "Executes a shell command. Use this to run tests, list files, or install dependencies. Returns the output.",
          parameters: {
            type: "object",
            properties: {
              command: { type: "string" }
            },
            required: ["command"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "git_commit",
          description: "Commit tracked changes using git commit -am.",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string" }
            },
            required: ["message"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_project",
          description:
            "Searches for a string pattern across all files in the project. Useful for finding function definitions, variable usages, or error constants.",
          parameters: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              case_sensitive: { type: "boolean" }
            },
            required: ["pattern"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for up-to-date information.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_url",
          description: "Read the content of a web page via Web Reader MCP.",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string" }
            },
            required: ["url"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "glob_files",
          description:
            "Find files matching a glob pattern (e.g., '**/*.ts', 'src/**/*.tsx'). Returns matching file paths.",
          parameters: {
            type: "object",
            properties: {
              pattern: {
                type: "string",
                description: "Glob pattern to match files (e.g., '**/*.ts', 'src/components/*.tsx')"
              },
              path: {
                type: "string",
                description: "Base directory to search from (default: current directory)"
              }
            },
            required: ["pattern"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "multi_edit",
          description:
            "Apply multiple edits across one or more files in a single operation. More efficient than multiple edit_file calls.",
          parameters: {
            type: "object",
            properties: {
              edits: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string", description: "File path to edit" },
                    old_string: { type: "string", description: "Text to replace" },
                    new_string: { type: "string", description: "Replacement text" }
                  },
                  required: ["path", "old_string", "new_string"]
                },
                description: "Array of edits to apply"
              }
            },
            required: ["edits"],
            additionalProperties: false
          }
        }
      }
    ];
  }

  async executeTool(
    name: string,
    args: unknown,
    options?: { signal?: AbortSignal }
  ): Promise<string> {
    switch (name) {
      case "list_files":
        return this.fsService.listFiles(args as { path: string; recursive?: boolean });
      case "read_file":
        return this.fsService.readFile(args as { path: string });
      case "write_file":
        return this.fsService.writeFile(args as { path: string; content: string });
      case "edit_file": {
        const payload = args as {
          path: string;
          old_string: string;
          new_string: string;
        };
        await this.patchService.applyEdit(
          payload.path,
          payload.old_string,
          payload.new_string
        );
        return `Edited ${payload.path}.`;
      }
      case "run_command":
        return this.shellService.execute(
          (args as { command: string }).command ?? "",
          options?.signal
        );
      case "git_commit":
        return this.gitService.commit((args as { message: string }).message ?? "");
      case "search_project":
        return this.searchService.search(
          (args as { pattern: string }).pattern ?? "",
          (args as { case_sensitive?: boolean }).case_sensitive ?? false
        );
      case "web_search":
        return this.callMcp(this.searchEndpoint, "webSearchPrime", args);
      case "read_url":
        return this.callMcp(this.readerEndpoint, "webReader", args);
      case "glob_files":
        return this.fsService.globFiles(args as { pattern: string; path?: string });
      case "multi_edit": {
        const payload = args as {
          edits: Array<{ path: string; old_string: string; new_string: string }>;
        };
        return this.executeMultiEdit(payload.edits);
      }
      default:
        throw new Error(`Unsupported tool: ${name}`);
    }
  }

  /**
   * Execute multiple edits across files
   */
  private async executeMultiEdit(
    edits: Array<{ path: string; old_string: string; new_string: string }>
  ): Promise<string> {
    const results: string[] = [];
    const errors: string[] = [];

    for (const edit of edits) {
      try {
        await this.patchService.applyEdit(
          edit.path,
          edit.old_string,
          edit.new_string
        );
        results.push(`✓ Edited ${edit.path}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`✗ Failed ${edit.path}: ${message}`);
      }
    }

    const summary = [
      ...results,
      ...errors,
      `\nTotal: ${results.length} succeeded, ${errors.length} failed`
    ].join("\n");

    return summary;
  }

  /**
   * Preview multiple edits
   */
  async previewMultiEdit(
    edits: Array<{ path: string; old_string: string; new_string: string }>
  ): Promise<Array<{ path: string; diff: string; error?: string }>> {
    const previews: Array<{ path: string; diff: string; error?: string }> = [];

    for (const edit of edits) {
      try {
        const preview = await this.patchService.previewEdit(
          edit.path,
          edit.old_string,
          edit.new_string
        );
        previews.push({ path: edit.path, diff: preview.diff });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        previews.push({ path: edit.path, diff: "", error: message });
      }
    }

    return previews;
  }

  async previewWriteFile(args: { path?: string; content?: string }) {
    return this.fsService.previewWriteFile(args);
  }

  async previewEditFile(args: {
    path?: string;
    old_string?: string;
    new_string?: string;
  }) {
    return this.patchService.previewEdit(
      args.path ?? "",
      args.old_string ?? "",
      args.new_string ?? ""
    );
  }

  private async callMcp(
    endpoint: string,
    methodName: string,
    args: unknown
  ): Promise<string> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: methodName,
          arguments: args
        },
        id: "1"
      })
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as MCPResponse;
    if (payload.error?.message) {
      throw new Error(`MCP error: ${payload.error.message}`);
    }

    if (payload.result?.content?.length) {
      const text = payload.result.content
        .map((item) => item.text)
        .filter(Boolean)
        .join("\n");
      if (text) {
        return text;
      }
    }

    return JSON.stringify(payload.result ?? {});
  }
}
