---
url: "https://docs.z.ai/devpack/extension/coding-tool-helper"
title: "Coding Tool Helper - Overview - Z.AI DEVELOPER DOCUMENT"
---

[Skip to main content](https://docs.z.ai/devpack/extension/coding-tool-helper#content-area)

🚀 GLM Coding Plan — built for devs: 3× usage, 1/7 cost • [Limited-Time Offer ➞](https://z.ai/subscribe?utm_campaign=Platform_Ops&_channel_track_key=DaprgHIc)

[Overview - Z.AI DEVELOPER DOCUMENT home page![light logo](https://mintcdn.com/zhipu-32152247/B_E8wI-eiNa1QlPV/logo/dark.svg?fit=max&auto=format&n=B_E8wI-eiNa1QlPV&q=85&s=75deefa9dea5bdbc84d4da68885c267f)![dark logo](https://mintcdn.com/zhipu-32152247/B_E8wI-eiNa1QlPV/logo/light.svg?fit=max&auto=format&n=B_E8wI-eiNa1QlPV&q=85&s=c1ecf1af358fa8eeab8c06052337f8f6)](https://z.ai/model-api)

English

Search...

Ctrl K

- [API Keys](https://z.ai/manage-apikey/apikey-list)
- [Payment Method](https://z.ai/manage-apikey/billing)

Search...

Navigation

Extensions Toolbox

Coding Tool Helper

[Guides](https://docs.z.ai/guides/overview/quick-start) [API Reference](https://docs.z.ai/api-reference/introduction) [Scenario Example](https://docs.z.ai/scenario-example/develop-tools/claude) [Coding Plan](https://docs.z.ai/devpack/overview) [Released Notes](https://docs.z.ai/release-notes/new-released) [Terms and Policy](https://docs.z.ai/legal-agreement/privacy-policy) [Help Center](https://docs.z.ai/help/faq)

##### GLM Coding Plan

- [Overview](https://docs.z.ai/devpack/overview)
- [Quick Start](https://docs.z.ai/devpack/quick-start)
- [FAQs](https://docs.z.ai/devpack/faq)

##### MCP Guide

- [Vision MCP Server](https://docs.z.ai/devpack/mcp/vision-mcp-server)
- [Web Search MCP Server](https://docs.z.ai/devpack/mcp/search-mcp-server)
- [Web Reader MCP Server](https://docs.z.ai/devpack/mcp/reader-mcp-server)
- [Zread MCP Server](https://docs.z.ai/devpack/mcp/zread-mcp-server)

##### Extensions Toolbox

- [Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper)
- [Usage Query Plugin](https://docs.z.ai/devpack/extension/usage-query-plugin)

##### Tool Guide

- [Claude Code](https://docs.z.ai/devpack/tool/claude)
- [Claude Code IDE Plugin](https://docs.z.ai/devpack/tool/claude-for-ide)
- [Cline](https://docs.z.ai/devpack/tool/cline)
- [TRAE](https://docs.z.ai/devpack/tool/trae)
- [Open Code](https://docs.z.ai/devpack/tool/opencode)
- [Kilo Code](https://docs.z.ai/devpack/tool/kilo)
- [Roo Code](https://docs.z.ai/devpack/tool/roo)
- [Crush](https://docs.z.ai/devpack/tool/crush)
- [Goose](https://docs.z.ai/devpack/tool/goose)
- [Factory Droid](https://docs.z.ai/devpack/tool/droid)
- [Cursor](https://docs.z.ai/devpack/tool/cursor)
- [Other Tools](https://docs.z.ai/devpack/tool/others)

##### Campaign Rules

- [Invite Friends, Get Credits](https://docs.z.ai/devpack/credit-campaign-rules)

On this page

- [Tool Overview](https://docs.z.ai/devpack/extension/coding-tool-helper#tool-overview)
- [Key Features](https://docs.z.ai/devpack/extension/coding-tool-helper#key-features)
- [Quick Start](https://docs.z.ai/devpack/extension/coding-tool-helper#quick-start)
- [Additional Information](https://docs.z.ai/devpack/extension/coding-tool-helper#additional-information)
- [Command List](https://docs.z.ai/devpack/extension/coding-tool-helper#command-list)
- [Troubleshooting](https://docs.z.ai/devpack/extension/coding-tool-helper#troubleshooting)

Extensions Toolbox

# Coding Tool Helper

Copy page

Copy page

A command-line assistant that helps GLM Coding Plan users centrally manage and configure CLI tools such as Claude Code.

**NPM Package**: [@z\_ai/coding-helper](https://www.npmjs.com/package/@z_ai/coding-helper)

**Prerequisite**: [Node.js >= v18.0.0](https://nodejs.org/en/download/)

## [​](https://docs.z.ai/devpack/extension/coding-tool-helper\#tool-overview)  Tool Overview

Coding Tool Helper is a coding-tool companion that quickly loads **GLM Coding Plan** into your favorite **Coding Tools**. Install and run it, then follow the on-screen guidance to automatically install tools, configure plan, and manage MCP servers.The current coding tools supported are:

- **Claude Code**
- **OpenCode**
- **Crush**
- **Factory Droid**

## [​](https://docs.z.ai/devpack/extension/coding-tool-helper\#key-features)  Key Features

## Interactive Wizard

Friendly setup guidance

## Plan Integration

Connect GLM Plan to your preferred coding tools

## Tool Management

Automatically detect, install, and configure coding tools

## MCP Configuration

Easily manage MCP services

## Local Storage

Secure local storage configuration

## I18n Support

Interfaces support multiple languages

## [​](https://docs.z.ai/devpack/extension/coding-tool-helper\#quick-start)  Quick Start

1

Get Your API Key

Visit the [Z.AI Open Platform](https://z.ai/model-api) to retrieve your API Key.

2

Install & Launch

Prerequisite: You need [Node.js 18+ or newer](https://nodejs.org/en/download/)

Choose either installation method below.

- Method 1 (Recommended: npx on demand)

- Method 2 (Global install for frequent use)


Best for occasional users—no global install required. Run via npx to start instantly.

Copy

Ask AI

```
## Run Coding Tool Helper directly in the terminal
npx @z_ai/coding-helper
```

Ideal for heavy users. Install globally, then launch with `coding-helper` or `chelper`.

If `npm install` fails with `permission denied`, add sudo (macOS/Linux) or run the terminal as administrator (Windows).

Example: `sudo npm install -g @z_ai/coding-helper`

Alternatively, simply use npx: `npx @z_ai/coding-helper`

Copy

Ask AI

```
## Install @z_ai/coding-helper globally
npm install -g @z_ai/coding-helper
## Then run coding-helper or chelper
coding-helper
```

3

Complete the wizard

Inside the wizard, use the arrow keys to choose options and Enter to confirm. Follow the guide to:

Select UI language —> Choose a coding plan —> Enter API key —> Pick tools to manage

—\> Auto-install tools (if needed) —> Open the tool management menu —> Load plan into tools

—\> Manage MCP services (optional) —> Finish setup and launch your coding tools

## [​](https://docs.z.ai/devpack/extension/coding-tool-helper\#additional-information)  Additional Information

### [​](https://docs.z.ai/devpack/extension/coding-tool-helper\#command-list)  Command List

> Beyond the interactive wizard, Coding Tool Helper also supports running specific commands via `coding-helper` or `chelper` with arguments:

Copy

Ask AI

```
# Launch the initialization wizard
coding-helper init

# Language management
coding-helper lang show              # Display the current language
coding-helper lang set en_US         # Switch to English
coding-helper lang --help            # View language command help

# API key management
coding-helper auth                   # Configure the key interactively
coding-helper auth glm_coding_plan_global <token>     # Select the Global plan and set the key directly
coding-helper auth revoke            # Remove the stored key
coding-helper auth reload claude     # Load the latest plan into Claude Code
coding-helper auth --help            # View auth command help

coding-helper doctor                 # Check system configuration and tool status
coding-helper --help                 # Show help information
coding-helper --version              # Show version
```

### [​](https://docs.z.ai/devpack/extension/coding-tool-helper\#troubleshooting)  Troubleshooting

If issues arise, run `coding-helper doctor` first for a health check.

Network error, please check your connection

**Issue:** When saving or validating the API KEY or performing other network operations, you may see network errors such as `Network Error`.**Solution:**

1. Check your network connection or configure a proxy.
2. Note: If you must use a proxy to access external networks, Node.js does not automatically use the system proxy settings. Set the environment variables `HTTP_PROXY` and `HTTPS_PROXY` to make Node.js use the proxy.

Copy

Ask AI

```
# Example:
export HTTP_PROXY=http://your.proxy.server:port
export HTTPS_PROXY=http://your.proxy.server:port
```

Network timeout

**Issue:** When running or installing the coding tools, timeout or other network timeout errors appear.**Solution:**

1. Check the network connection or configure a proxy.

Insufficient permissions EACCES: permission denied

**Issue:**`npm install -g` throws EACCES: permission denied.**Solution:**

1. Retry with sudo (macOS / Linux).
2. Run the terminal as administrator (Windows).
3. Start directly via `npx @z_ai/coding-helper`.
4. Use nvm to manage Node.js versions and avoid global permission issues.

Incorrect plugin status in the Claude Code Marketplace

**Issue:** While using the Claude Code Marketplace, the plugin status is incorrect (e.g., it shows “not installed” even though it is already installed).**Solution:**

1. Run `claude update` to upgrade Claude Code to version 2.0.70 or later.

API Key invalid

**Issue:** API Key reported as invalid.**Solution:**

1. Confirm the API Key was copied correctly.
2. Check that the associated account has sufficient balance.

Connection timeout

**Issue:** Service connection timed out.**Solution:**

1. Check network connectivity.
2. Verify firewall settings.
3. Ensure Node.js and the network environment are ready.

Was this page helpful?

YesNo

[Zread MCP Server](https://docs.z.ai/devpack/mcp/zread-mcp-server) [Usage Query Plugin](https://docs.z.ai/devpack/extension/usage-query-plugin)

Ctrl+I

[x](https://x.com/Zai_org) [github](https://github.com/zai-org) [discord](https://discord.gg/QR7SARHRxK) [linkedin](https://www.linkedin.com/company/zdotai/)

[Powered by](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=zhipu-32152247)

Assistant

Responses are generated using AI and may contain mistakes.