# My Agent

Terminal-based coding assistant for the Z.AI Coding Plan. It supports safe file edits, tool-based workflows, auto-context, and session persistence.

## Installation

If published:

```bash
npm install -g my-agent
```

For local development from this repo:

```bash
npm install
npm run build
npm link
```

## Setup

The API key is resolved in this order:

1. `Z_AI_API_KEY` in the current shell
2. `.env` in the current working directory
3. `~/.zai/config.json`

To set a global key:

```bash
my-agent config --set-key <KEY>
```

You can also add `Z_AI_API_KEY` to a project-local `.env` file.

## Usage

```bash
my-agent
```

Resume the last session:

```bash
my-agent --resume
```

## Modes (Plan vs Act)

Press `Shift+Tab` while typing to toggle modes:

- PLAN: Architect mode, produces a step-by-step plan without using tools.
- ACT: Engineer mode, executes the plan using tools and code edits.

The current mode is shown in the prompt: `[PLAN] >` or `[ACT] >`.

## Tools

Local tools:

- `list_files` — list local files/folders
- `read_file` — read a local file
- `write_file` — write a local file (diff shown, requires confirmation)
- `run_command` — run a shell command (requires confirmation)
- `git_commit` — commit tracked changes (requires confirmation)
- `search_project` — search the local codebase

Remote MCP tools:

- `web_search` — web search
- `read_url` — read web page content

## Slash Commands

- `/add <path>` — pin a file to context
- `/drop <path>` — unpin a file
- `/files` — list pinned files
- `/clear` — clear chat history (keeps context)
- `/reset` — clear chat history and pinned files
- `/help` — show help

## Key Features

- Auto-context: a live project tree is injected into the system prompt.
- Agentic retrieval: uses `search_project` and `read_file` before answering.
- Git awareness: git status is injected into context; dirty marker in footer.
- Session persistence: chat history, pinned files, and mode are saved to `.zai/session.json`.
- Human-in-the-loop safety: diff review for edits and approvals for commands/commits.
