---
url: "https://docs.z.ai/devpack/mcp/zread-mcp-server"
title: "Zread MCP Server - Overview - Z.AI DEVELOPER DOCUMENT"
---

[Skip to main content](https://docs.z.ai/devpack/mcp/zread-mcp-server#content-area)

🚀 GLM Coding Plan — built for devs: 3× usage, 1/7 cost • [Limited-Time Offer ➞](https://z.ai/subscribe?utm_campaign=Platform_Ops&_channel_track_key=DaprgHIc)

[Overview - Z.AI DEVELOPER DOCUMENT home page![light logo](https://mintcdn.com/zhipu-32152247/B_E8wI-eiNa1QlPV/logo/dark.svg?fit=max&auto=format&n=B_E8wI-eiNa1QlPV&q=85&s=75deefa9dea5bdbc84d4da68885c267f)![dark logo](https://mintcdn.com/zhipu-32152247/B_E8wI-eiNa1QlPV/logo/light.svg?fit=max&auto=format&n=B_E8wI-eiNa1QlPV&q=85&s=c1ecf1af358fa8eeab8c06052337f8f6)](https://z.ai/model-api)

English

Search...

Ctrl K

- [API Keys](https://z.ai/manage-apikey/apikey-list)
- [Payment Method](https://z.ai/manage-apikey/billing)

Search...

Navigation

MCP Guide

Zread MCP Server

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

- [Overview](https://docs.z.ai/devpack/mcp/zread-mcp-server#overview)
- [Features](https://docs.z.ai/devpack/mcp/zread-mcp-server#features)
- [Tools](https://docs.z.ai/devpack/mcp/zread-mcp-server#tools)
- [Example Scenarios](https://docs.z.ai/devpack/mcp/zread-mcp-server#example-scenarios)
- [Installation and Usage](https://docs.z.ai/devpack/mcp/zread-mcp-server#installation-and-usage)
- [Quick Start](https://docs.z.ai/devpack/mcp/zread-mcp-server#quick-start)
- [Supported Clients](https://docs.z.ai/devpack/mcp/zread-mcp-server#supported-clients)
- [Troubleshooting](https://docs.z.ai/devpack/mcp/zread-mcp-server#troubleshooting)
- [Quota](https://docs.z.ai/devpack/mcp/zread-mcp-server#quota)
- [Resources](https://docs.z.ai/devpack/mcp/zread-mcp-server#resources)

MCP Guide

# Zread MCP Server

Copy page

Copy page

The Zread MCP Server is a Z.AI implementation based on the Model Context Protocol (MCP). Powered by [zread.ai](https://zread.ai/), it provides Claude Code, Cline, and other MCP-compatible clients with knowledge documentation and code access capabilities for open source repositories.

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#overview)  Overview

This remote MCP server with open source repository Q&A capability is available to users on **GLM Coding Plan**, enabling your code agent to deeply understand open source projects and efficiently fetch documentation, code structure, and file content.

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#features)  Features

## Documentation Search

Search documentation, code, and comments in Github repositories

## Repository Structure

Get the directory structure and file list of GitHub repositories to quickly master project layout

## Code Reading

Read the complete code content of specified files in GitHub repositories to deeply analyze implementation details

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#tools)  Tools

This server implements the Model Context Protocol and works with any MCP-compatible client. Currently, it provides the following tools:

- **`search_doc`** — Search for knowledge documentation corresponding to the GitHub repository, quickly understanding repository knowledge, news, recent issues, PRs, and contributors.
- **`get_repo_structure`** — Get the directory structure and file list of the GitHub repository to understand project module splitting and directory organization.
- **`read_file`** — Read the complete code content of specified files in the GitHub repository to deeply analyze the implementation details of the file code.

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#example-scenarios)  Example Scenarios

Quick Start with Open Source Libraries

Quickly understand the core concepts, installation steps, and code organization of open source libraries by searching documentation and obtaining repository structures, accelerating the learning curve.

Issue Troubleshooting and History

When encountering problems, search the repository’s Issue and Commit history to find solutions or fix records for similar problems.

Deep Source Code Analysis

Directly read the code content of core files, analyze implementation logic, and assist in secondary development or Debugging.

Dependency Library Research

Before introducing a new dependency library, evaluate its activity, code quality, and maintenance status by viewing its repository structure and documentation.

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#installation-and-usage)  Installation and Usage

### [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#quick-start)  Quick Start

1

Get API Key

Visit [Z.AI Console](https://z.ai/manage-apikey/apikey-list) to get your api key

2

Configure MCP Server

According to the client you’re using, **choose the corresponding installation method from the options below**.

### [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#supported-clients)  Supported Clients

- Claude Code

- Cline (VS Code)

- OpenCode

- Crush

- Goose

- Roo Code, Kilo Code, Others


**One-click install command**Replace `your_api_key` with the API key you obtained in the previous step

Copy

Ask AI

```
claude mcp add -s user -t http zread https://api.z.ai/api/mcp/zread/mcp --header "Authorization: Bearer your_api_key"
```

**Manual configuration**Edit the Claude Code configuration file under your home directory, the MCP section of `.claude.json`:

Copy

Ask AI

```
{
  "mcpServers": {
    "zread": {
      "type": "http",
      "url": "https://api.z.ai/api/mcp/zread/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

Add the MCP server configuration in the Cline extension settings:Replace `your_api_key` with the API key you obtained in the previous step

Copy

Ask AI

```
{
  "mcpServers": {
    "zread": {
      "type": "streamableHttp",
      "url": "https://api.z.ai/api/mcp/zread/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

If Cline older version does not support StreamableHttp type MCP server, you can use SSE type configuration:

Copy

Ask AI

```
{
  "mcpServers": {
    "zread": {
      "type": "sse",
      "url": "https://api.z.ai/api/mcp/zread/sse?Authorization=your_api_key"
    }
  }
}
```

Add the MCP server configuration in OpenCode settings:See the [OpenCode MCP documentation](https://opencode.ai/docs/mcp-servers)Replace `your_api_key` with the API key you obtained in the previous step

Copy

Ask AI

```
{
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "zread": {
            "type": "remote",
            "url": "https://api.z.ai/api/mcp/zread/mcp",
            "headers": {
                "Authorization": "Bearer your_api_key"
            }
        }
    }
}
```

Add the MCP server configuration in Crush settings:Replace `your_api_key` with the API key you obtained in the previous step

Copy

Ask AI

```
{
    "$schema": "https://charm.land/crush.json",
    "mcp": {
        "zread": {
            "type": "http",
            "url": "https://api.z.ai/api/mcp/zread/mcp",
            "headers": {
                "Authorization": "Bearer your_api_key"
            }
        }
    }
}
```

Add the MCP server in Goose:Go to `Extensions` -\> `Add custom extension`Set Extension Name to `zread`, Type to `SSE`, and use the following endpoint:

Copy

Ask AI

```
https://api.z.ai/api/mcp/zread/sse?Authorization=your_api_key
```

Click `Add Extension` at the bottom. Remember to replace `your_api_key` with the API key you obtained in the previous step.

For Roo Code, Kilo Code, and other MCP-compatible clients, use the following general configuration:Replace `your_api_key` with the API key you obtained in the previous step

Copy

Ask AI

```
{
  "mcpServers": {
    "zread": {
      "type": "streamable-http",
      "url": "https://api.z.ai/api/mcp/zread/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#troubleshooting)  Troubleshooting

Invalid access token

**Issue:** Received an invalid access token error**Solutions:**

1. Verify the token was copied correctly
2. Check that the token is activated
3. Ensure the token has sufficient balance
4. Confirm the Authorization header format is correct

Connection timeout

**Issue:** Connection to the MCP server timed out**Solutions:**

1. Check your network connection
2. Verify firewall settings
3. Ensure the server URL is correct
4. Increase client timeout settings

Repository access failed

**Issue:** Unable to search or read specified repository content**Solutions:**

1. Confirm the repository exists and is open source (public)
2. Check if the repository name is spelled correctly (owner/repo)
3. Visit zread.ai to search if this open source repository is supported

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#quota)  Quota

The MCP quotas for the Lite, Pro and Max plans are as follows:

- **Lite:** Include a total of 100 web searches, web readers and ZRead MCP calls, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Pro:** Include a total of 1,000 web searches, web readers and ZRead MCP calls, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Max:** Include a total of 4,000 web searches, web readers and ZRead MCP calls, along with the 5-hour maximum prompt resource pool of the package for vision understanding.

## [​](https://docs.z.ai/devpack/mcp/zread-mcp-server\#resources)  Resources

- [Model Context Protocol (MCP) Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Configuration Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Z.AI API Reference](https://docs.z.ai/api-reference/introduction)
- [GLM Coding Plan Overview](https://docs.z.ai/devpack/overview)

Was this page helpful?

YesNo

[Web Reader MCP Server](https://docs.z.ai/devpack/mcp/reader-mcp-server) [Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper)

Ctrl+I

[x](https://x.com/Zai_org) [github](https://github.com/zai-org) [discord](https://discord.gg/QR7SARHRxK) [linkedin](https://www.linkedin.com/company/zdotai/)

[Powered by](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=zhipu-32152247)

Assistant

Responses are generated using AI and may contain mistakes.