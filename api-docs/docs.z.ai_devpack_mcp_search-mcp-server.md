---
url: "https://docs.z.ai/devpack/mcp/search-mcp-server"
title: "Web Search MCP Server - Overview - Z.AI DEVELOPER DOCUMENT"
---

[Skip to main content](https://docs.z.ai/devpack/mcp/search-mcp-server#content-area)

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

Web Search MCP Server

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

- [Product Overview](https://docs.z.ai/devpack/mcp/search-mcp-server#product-overview)
- [Features](https://docs.z.ai/devpack/mcp/search-mcp-server#features)
- [Supported Tools](https://docs.z.ai/devpack/mcp/search-mcp-server#supported-tools)
- [Installation and Usage](https://docs.z.ai/devpack/mcp/search-mcp-server#installation-and-usage)
- [Quick Start](https://docs.z.ai/devpack/mcp/search-mcp-server#quick-start)
- [Supported Clients](https://docs.z.ai/devpack/mcp/search-mcp-server#supported-clients)
- [Usage Example](https://docs.z.ai/devpack/mcp/search-mcp-server#usage-example)
- [Troubleshooting](https://docs.z.ai/devpack/mcp/search-mcp-server#troubleshooting)
- [Quota](https://docs.z.ai/devpack/mcp/search-mcp-server#quota)
- [Related Resources](https://docs.z.ai/devpack/mcp/search-mcp-server#related-resources)

MCP Guide

# Web Search MCP Server

Copy page

Copy page

Web Search MCP Server is a Z.AI search capability implementation based on the Model Context Protocol (MCP), providing powerful Z.AI search capabilities for MCP-compatible clients such as Claude Code and Cline, including web search, real-time information retrieval, and other features.

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#product-overview)  Product Overview

This Remote MCP Server with search capabilities is an exclusive server developed by Z.AI for **GLM Coding Plan users**, empowering your Code Agent with search capabilities and unlimited access to real-time information and web resources.

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#features)  Features

## Web Search

Supports comprehensive web search to retrieve the latest web information and resources

## Real-time Information

Retrieves real-time updated information including news, stock prices, weather, and more

## Remote Service

HTTP protocol-based remote MCP service, no local installation required

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#supported-tools)  Supported Tools

This server implements the Model Context Protocol and can be used with any MCP-compatible client. Currently provides the following tools:

- **`webSearchPrime`** \- Search web information, returning results including page titles, URLs, summaries, site names, site icons, and more.

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#installation-and-usage)  Installation and Usage

### [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#quick-start)  Quick Start

1

Get API Key

Visit [Z.AI Console](https://z.ai/manage-apikey/apikey-list) to get your api key

2

Configure MCP Server

According to the client you’re using, **choose the corresponding installation method from the options below**.

### [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#supported-clients)  Supported Clients

- Claude Code

- Cline (VS Code)

- OpenCode

- Crush

- Goose

- Roo Code, Kilo Code and Other MCP Clients


**One-click Installation Command**Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
claude mcp add -s user -t http web-search-prime https://api.z.ai/api/mcp/web_search_prime/mcp --header "Authorization: Bearer your_api_key"
```

**Manual Configuration**Edit Claude Code’s configuration file `.claude.json` in the user directory, MCP section:

Copy

Ask AI

```
{
  "mcpServers": {
    "web-search-prime": {
      "type": "http",
      "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

Add MCP server configuration in Cline extension settings:Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
{
  "mcpServers": {
    "web-search-prime": {
      "type": "streamableHttp",
      "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
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
    "web-search-prime": {
      "type": "sse",
      "url": "https://api.z.ai/api/mcp/web_search_prime/sse?Authorization=your_api_key"
    }
  }
}
```

Add MCP server configuration in OpenCode settings:Refer [OpenCode MCP Doc](https://opencode.ai/docs/mcp-servers)Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
{
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "web-search-prime": {
            "type": "remote",
            "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
            "headers": {
                "Authorization": "Bearer your_api_key"
            }
        }
    }
}
```

Add MCP server configuration in Crush settings:Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
{
    "$schema": "https://charm.land/crush.json",
    "mcp": {
        "web-search-prime": {
            "type": "http",
            "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
            "headers": {
                "Authorization": "Bearer your_api_key"
            }
        }
    }
}
```

Add MCP server configuration in Goose settings:Click `Extensions` -\> `Add custom extension`Set `Extension Name` is `web-search-prime`，`Type` switch `SSE`，`Endpoint` as follow：

Copy

Ask AI

```
https://api.z.ai/api/mcp/web_search_prime/sse?Authorization=your_api_key
```

Finally, click `Add Extension` at the bottom. Remember to replace your\_api\_key with the API Key you obtained in the previous step.

For Roo Code, Kilo Code and other clients that support MCP protocol, use the following general configuration:Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
{
  "mcpServers": {
    "web-search-prime": {
      "type": "streamable-http",
      "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#usage-example)  Usage Example

Through the previous step of installing the Search MCP server to the client, you can directly use MCP in your Coding client.

You can directly use search functionality in conversations:

- “Help me search for the latest AI technology developments”
- “Find best practices for Python asynchronous programming”

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#troubleshooting)  Troubleshooting

Invalid API Key

**Issue:** Receiving invalid api key error**Solutions:**

1. Confirm the api key is correctly copied
2. Check if the api key is activated
3. Confirm the api key has sufficient balance
4. Check if the Authorization header format is correct

Connection Timeout

**Issue:** MCP server connection timeout**Solutions:**

1. Check network connection
2. Confirm firewall settings
3. Verify the server URL is correct
4. Increase timeout settings

Empty Search Results

**Issue:** Search returns empty results**Solutions:**

1. Try using different search keywords
2. Check if the search query is too specific
3. Confirm network connection is normal
4. Contact technical support for assistance

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#quota)  Quota

The MCP quotas for the Lite, Pro and Max plans are as follows:

- **Lite:** Include a total of 100 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Pro:** Include a total of 1,000 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Max:** Include a total of 4,000 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.

## [​](https://docs.z.ai/devpack/mcp/search-mcp-server\#related-resources)  Related Resources

- [Model Context Protocol (MCP) Official Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Configuration Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Z.AI API Reference](https://docs.z.ai/api-reference/introduction)
- [GLM Coding Plan Overview](https://docs.z.ai/devpack/overview)

Was this page helpful?

YesNo

[Vision MCP Server](https://docs.z.ai/devpack/mcp/vision-mcp-server) [Web Reader MCP Server](https://docs.z.ai/devpack/mcp/reader-mcp-server)

Ctrl+I

[x](https://x.com/Zai_org) [github](https://github.com/zai-org) [discord](https://discord.gg/QR7SARHRxK) [linkedin](https://www.linkedin.com/company/zdotai/)

[Powered by](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=zhipu-32152247)

Assistant

Responses are generated using AI and may contain mistakes.