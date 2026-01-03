---
url: "https://docs.z.ai/devpack/extension/usage-query-plugin"
title: "Usage Query Plugin - Overview - Z.AI DEVELOPER DOCUMENT"
---

[Skip to main content](https://docs.z.ai/devpack/extension/usage-query-plugin#content-area)

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

Usage Query Plugin

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

- [Prerequisites](https://docs.z.ai/devpack/extension/usage-query-plugin#prerequisites)
- [Quick Start](https://docs.z.ai/devpack/extension/usage-query-plugin#quick-start)
- [Usage](https://docs.z.ai/devpack/extension/usage-query-plugin#usage)
- [Build Marketplace Together](https://docs.z.ai/devpack/extension/usage-query-plugin#build-marketplace-together)

Extensions Toolbox

# Usage Query Plugin

Copy page

Query quota and usage statistics for GLM Coding Plan.

Copy page

The **glm-plan-usage** plugin allows you to query your current quota and usage statistics for the GLM Coding Plan directly within your Claude Code.**Github Repo**: [zai-coding-plugins](https://github.com/zai-org/zai-coding-plugins)

## [​](https://docs.z.ai/devpack/extension/usage-query-plugin\#prerequisites)  Prerequisites

- Node.js 18 or higher
- Install Claude Code CLI (See [Claude Code](https://docs.z.ai/devpack/tool/claude))

## [​](https://docs.z.ai/devpack/extension/usage-query-plugin\#quick-start)  Quick Start

Install the marketplace within Claude Code to access the plugins.

- Method A: Manual Installation

- Method B: Automated Tool


Prerequisite: Git environment is set up.**1\. Install the Marketplace**

Copy

Ask AI

```
claude plugin marketplace add zai-org/zai-coding-plugins
```

**2\. Install Plugin**

Copy

Ask AI

```
claude plugin install glm-plan-usage@zai-coding-plugins
```

Run the `npx @z_ai/coding-helper` tool to manage and install the plugins directly.`Start` -\> `Coding Tool` -\> `Claude Code` -\> `Plugin Marketplace`

Copy

Ask AI

```
npx @z_ai/coding-helper
```

## [​](https://docs.z.ai/devpack/extension/usage-query-plugin\#usage)  Usage

1

Start Claude Code

Navigate to your project and start Claude Code:

Copy

Ask AI

```
claude
```

2

Query Usage

Use the following command to check your current quota and usage:

Copy

Ask AI

```
/glm-plan-usage:usage-query
```

## [​](https://docs.z.ai/devpack/extension/usage-query-plugin\#build-marketplace-together)  Build Marketplace Together

[**GitHub Repository** \\
\\
View source code, submit issues, contribute](https://github.com/zai-org/zai-coding-plugins) [**Plugin Marketplace** \\
\\
View how to build the plugin](https://code.claude.com/docs/en/plugins)

Was this page helpful?

YesNo

[Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper) [Claude Code](https://docs.z.ai/devpack/tool/claude)

Ctrl+I

[x](https://x.com/Zai_org) [github](https://github.com/zai-org) [discord](https://discord.gg/QR7SARHRxK) [linkedin](https://www.linkedin.com/company/zdotai/)

[Powered by](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=zhipu-32152247)

Assistant

Responses are generated using AI and may contain mistakes.