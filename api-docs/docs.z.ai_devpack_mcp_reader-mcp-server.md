---
url: "https://docs.z.ai/devpack/mcp/reader-mcp-server"
title: "Web Reader MCP Server - Overview - Z.AI DEVELOPER DOCUMENT"
---

[Skip to main content](https://docs.z.ai/devpack/mcp/reader-mcp-server#content-area)

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

Web Reader MCP Server

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

- [Overview](https://docs.z.ai/devpack/mcp/reader-mcp-server#overview)
- [Features](https://docs.z.ai/devpack/mcp/reader-mcp-server#features)
- [Tools](https://docs.z.ai/devpack/mcp/reader-mcp-server#tools)
- [Example Scenarios](https://docs.z.ai/devpack/mcp/reader-mcp-server#example-scenarios)
- [Installation and Usage](https://docs.z.ai/devpack/mcp/reader-mcp-server#installation-and-usage)
- [Quick Start](https://docs.z.ai/devpack/mcp/reader-mcp-server#quick-start)
- [Supported Clients](https://docs.z.ai/devpack/mcp/reader-mcp-server#supported-clients)
- [Troubleshooting](https://docs.z.ai/devpack/mcp/reader-mcp-server#troubleshooting)
- [Quota](https://docs.z.ai/devpack/mcp/reader-mcp-server#quota)
- [Resources](https://docs.z.ai/devpack/mcp/reader-mcp-server#resources)

MCP Guide

# Web Reader MCP Server

Copy page

Copy page

The Web Reader MCP Server is a Z.AI implementation based on the Model Context Protocol (MCP). It provides Claude Code, Cline, and other MCP-compatible clients with powerful web content extraction capabilities, including full-page content retrieval and structured data extraction.

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#overview)  Overview

This remote MCP server with web content reading capability is available to users on **GLM Coding Plan**, enabling your code agent to fetch detailed page content and structured data.

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#features)  Features

## Web Content Reading

Fetch the complete content of any webpage, including text, and links

## Structured Data

Extract structured data such as title, main body, and metadata

## Remote Service

HTTP-based remote MCP service, no local installation required

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#tools)  Tools

This server implements the Model Context Protocol and works with any MCP-compatible client. Currently, it provides the following tool:

- **`webReader`** — Fetch webpage content for a specified URL. Returns the page title, main content, metadata, list of links, and more.

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#example-scenarios)  Example Scenarios

API Documentation Reading and Summarization

Automatically fetch and parse titles, body content, examples, and release notes from official documentation pages, distilling key takeaways to accelerate integration and implementation.

Open Source Project Page Parsing

Parse project websites or repository pages (such as README, release notes, and usage guides) to extract core information and link lists, assisting evaluation and integration.

Technical Article Understanding and Knowledge Extraction

Extract steps, commands, and caveats from blogs, tutorials, and guide pages, organizing unstructured content into actionable developer notes and task lists.

Bug Resolution Using Reference Documentation

For issue remediation, read the publicly available steps on the specified web page and use them as references to resolve the problem.

Knowledge Base Construction and Synchronization

Convert content from designated web pages into structured data and leverage in-page links for incremental synchronization to build a team technical knowledge base.

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#installation-and-usage)  Installation and Usage

### [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#quick-start)  Quick Start

1

Get API Key

Visit [Z.AI Console](https://z.ai/manage-apikey/apikey-list) to get your api key

2

Configure MCP Server

According to the client you’re using, **choose the corresponding installation method from the options below**.

### [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#supported-clients)  Supported Clients

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
claude mcp add -s user -t http web-reader https://api.z.ai/api/mcp/web_reader/mcp --header "Authorization: Bearer your_api_key"
```

**Manual configuration**Edit the Claude Code configuration file under your home directory, the MCP section of `.claude.json`:

Copy

Ask AI

```
{
  "mcpServers": {
    "web-reader": {
      "type": "http",
      "url": "https://api.z.ai/api/mcp/web_reader/mcp",
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
    "web-reader": {
      "type": "streamableHttp",
      "url": "https://api.z.ai/api/mcp/web_reader/mcp",
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
    "web-reader": {
      "type": "sse",
      "url": "https://api.z.ai/api/mcp/web_reader/sse?Authorization=your_api_key"
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
        "web-reader": {
            "type": "remote",
            "url": "https://api.z.ai/api/mcp/web_reader/mcp",
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
        "web-reader": {
            "type": "http",
            "url": "https://api.z.ai/api/mcp/web_reader/mcp",
            "headers": {
                "Authorization": "Bearer your_api_key"
            }
        }
    }
}
```

Add the MCP server in Goose:Go to `Extensions` -\> `Add custom extension`Set Extension Name to `web-reader`, Type to `SSE`, and use the following endpoint:

Copy

Ask AI

```
https://api.z.ai/api/mcp/web_reader/sse?Authorization=your_api_key
```

Click `Add Extension` at the bottom. Remember to replace `your_api_key` with the API key you obtained in the previous step.

For Roo Code, Kilo Code, and other MCP-compatible clients, use the following general configuration:Replace `your_api_key` with the API key you obtained in the previous step

Copy

Ask AI

```
{
  "mcpServers": {
    "web-reader": {
      "type": "streamable-http",
      "url": "https://api.z.ai/api/mcp/web_reader/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#troubleshooting)  Troubleshooting

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

Webpage fetch failed

**Issue:** Web content reading returned empty result or error**Solutions:**

1. Confirm the target URL is accessible
2. Check if the page has anti-scraping mechanisms
3. Try different URLs
4. Ensure network connectivity is normal
5. Contact technical support for assistance

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#quota)  Quota

The MCP quotas for the Lite, Pro and Max plans are as follows:

- **Lite:** Include a total of 100 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Pro:** Include a total of 1,000 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Max:** Include a total of 4,000 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.

## [​](https://docs.z.ai/devpack/mcp/reader-mcp-server\#resources)  Resources

- [Model Context Protocol (MCP) Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Configuration Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Z.AI API Reference](https://docs.z.ai/api-reference/introduction)
- [GLM Coding Plan Overview](https://docs.z.ai/devpack/overview)

Was this page helpful?

YesNo

[Web Search MCP Server](https://docs.z.ai/devpack/mcp/search-mcp-server) [Zread MCP Server](https://docs.z.ai/devpack/mcp/zread-mcp-server)

Ctrl+I

[x](https://x.com/Zai_org) [github](https://github.com/zai-org) [discord](https://discord.gg/QR7SARHRxK) [linkedin](https://www.linkedin.com/company/zdotai/)

[Powered by](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=zhipu-32152247)

Assistant

Responses are generated using AI and may contain mistakes.