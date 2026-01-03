---
url: "https://docs.z.ai/devpack/mcp/vision-mcp-server"
title: "Vision MCP Server - Overview - Z.AI DEVELOPER DOCUMENT"
---

[Skip to main content](https://docs.z.ai/devpack/mcp/vision-mcp-server#content-area)

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

Vision MCP Server

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

- [Product Overview](https://docs.z.ai/devpack/mcp/vision-mcp-server#product-overview)
- [Features](https://docs.z.ai/devpack/mcp/vision-mcp-server#features)
- [Supported Tools](https://docs.z.ai/devpack/mcp/vision-mcp-server#supported-tools)
- [Environment Variable Configuration](https://docs.z.ai/devpack/mcp/vision-mcp-server#environment-variable-configuration)
- [Detailed Configuration](https://docs.z.ai/devpack/mcp/vision-mcp-server#detailed-configuration)
- [Installation and Usage](https://docs.z.ai/devpack/mcp/vision-mcp-server#installation-and-usage)
- [Quick Start](https://docs.z.ai/devpack/mcp/vision-mcp-server#quick-start)
- [Supported Clients](https://docs.z.ai/devpack/mcp/vision-mcp-server#supported-clients)
- [Usage Example](https://docs.z.ai/devpack/mcp/vision-mcp-server#usage-example)
- [Troubleshooting](https://docs.z.ai/devpack/mcp/vision-mcp-server#troubleshooting)
- [Quota](https://docs.z.ai/devpack/mcp/vision-mcp-server#quota)
- [Related Resources](https://docs.z.ai/devpack/mcp/vision-mcp-server#related-resources)

MCP Guide

# Vision MCP Server

Copy page

Copy page

Vision MCP Server is a Z.AI capability implementation based on the Model Context Protocol (MCP), providing powerful Z.AI GLM-4.6V capabilities for MCP-compatible clients such as Claude Code and Cline, including image analysis, video understanding, and other features.

**NPM Package**: [@z\_ai/mcp-server](https://www.npmjs.com/package/@z_ai/mcp-server)

**Prerequisites**: [Node.js >= v22.0.0](https://nodejs.org/en/download/)

Please install the latest version(>= 0.1.2) of the vision mcp server to experience the GLM-4.6V capability.

Existing users might still be using a cached older version. Please clear the npx cache, or append the `@latest` tag to `z_ai/mcp-server` to force-install the newest version (i.e., `z_ai/mcp-server@latest`).

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#product-overview)  Product Overview

This Local MCP Server is an exclusive server developed by Z.AI for **GLM Coding Plan users**, empowering your Code Agent with eyes and limitless vision understanding.

Except in Claude Code, pasting an image directly into the client cannot call this MCP Server, as the client will by default transcode the image and call the model interface directly.

The best practice is to place the image in a local directory and invoke the MCP Server by specifying the image name or path in the conversation.

For example: `What does demo.png describe?`

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#features)  Features

## Image Analysis

Supports intelligent analysis and content understanding of multiple image formats, giving your AI Agent visual capabilities

## Video Understanding

Supports visual understanding of both local and remote videos

## Easy Integration

One-click installation, quick integration with Claude Code and other MCP-compatible clients

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#supported-tools)  Supported Tools

This server implements the Model Context Protocol and can be used with any MCP-compatible client. Currently provides the following tools:

- **`ui_to_artifact`** \- Turn UI screenshots into code, prompts, specs, or descriptions.
- **`extract_text_from_screenshot`** \- OCR screenshots for code, terminals, docs, and general text.
- **`diagnose_error_screenshot`** \- Analyze error snapshots and propose actionable fixes.
- **`understand_technical_diagram`** \- Interpret architecture, flow, UML, ER, and system diagrams.
- **`analyze_data_visualization`** \- Read charts and dashboards to surface insights and trends.
- **`ui_diff_check`** \- Compare two UI shots to flag visual or implementation drift.
- **`image_analysis`** \- General-purpose image understanding when other tools don’t fit.
- **`video_analysis`** \- Inspect videos (local/remote ≤8 MB; MP4/MOV/M4V) to describe scenes, moments, and entities.

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#environment-variable-configuration)  Environment Variable Configuration

### [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#detailed-configuration)  Detailed Configuration

| Environment Variable | Description | Default Value | Optional Values |
| --- | --- | --- | --- |
| `Z_AI_API_KEY` | Z.AI API KEY | Required | Your API key |
| `Z_AI_MODE` | Service platform selection | Required | `ZAI` |

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#installation-and-usage)  Installation and Usage

### [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#quick-start)  Quick Start

1

Get API Key

Visit [Z.AI Open Platform](https://z.ai/manage-apikey/apikey-list) to get your API Key

2

Install MCP Server

Prerequisites: [Node.js >= v22.0.0](https://nodejs.org/en/download/)

According to the client you’re using, **choose the corresponding installation method from the options below**.

### [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#supported-clients)  Supported Clients

- Claude Desktop

- Cline (VS Code)

- OpenCode

- Crush

- Roo Code, Kilo Code and Other MCP Clients


**Method A: One-click Installation Command**Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
claude mcp add -s user zai-mcp-server --env Z_AI_API_KEY=your_api_key Z_AI_MODE=ZAI -- npx -y "@z_ai/mcp-server"
```

If you forgot to replace the API Key, you need to uninstall the old MCP Server before re-executing the installation command:

Copy

Ask AI

```
claude mcp list
claude mcp remove zai-mcp-server
```

**Method B: Manual Configuration**Edit Claude Desktop’s configuration file `.claude.json``mcpServers` content:

Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
{
  "mcpServers": {
    "zai-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": [\
        "-y",\
        "@z_ai/mcp-server"\
      ],
      "env": {
        "Z_AI_API_KEY": "your_api_key",
        "Z_AI_MODE": "ZAI"
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
    "zai-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": [\
        "-y",\
        "@z_ai/mcp-server"\
      ],
      "env": {
        "Z_AI_API_KEY": "your_api_key",
        "Z_AI_MODE": "ZAI"
      }
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
        "zai-mcp-server": {
            "type": "local",
            "command": ["npx","-y","@z_ai/mcp-server"],
            "environment": {
                "Z_AI_API_KEY": "your_api_key",
                "Z_AI_MODE": "ZAI"
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
        "zai-mcp-server": {
            "type": "stdio",
            "command": "npx",
            "args": [\
                "-y",\
                "@z_ai/mcp-server"\
            ],
            "env": {
                "Z_AI_API_KEY": "your_api_key",
                "Z_AI_MODE": "ZAI"
            }
        }
    }
}
```

For Roo Code, Kilo Code and other clients that support MCP protocol, use the following general configuration:Be sure to replace `your_api_key` with the API Key you obtained.

Copy

Ask AI

```
{
  "mcpServers": {
    "zai-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": [\
        "-y",\
        "@z_ai/mcp-server"\
      ],
      "env": {
        "Z_AI_API_KEY": "your_api_key",
        "Z_AI_MODE": "ZAI"
      }
    }
  }
}
```

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#usage-example)  Usage Example

Except in Claude Code, pasting an image directly into the client cannot call this MCP Server, as the client will by default transcode the image and call the model interface directly.

The best practice is to place the image in a local directory and invoke the MCP Server by specifying the image name or path in the conversation.

For example: `What does demo.png describe?`

Through the previous step of installing the Vision MCP server to the client, you can directly use MCP in your Coding client.

For example, in Claude Code, inputting `hi describe this xx.png` in the conversation, the MCP Server will process the image and return the description result. (The prerequisite is that you have the image in your current directory)![Description](https://cdn.bigmodel.cn/markdown/1760501186683image.png?attname=image.png)![code](https://cdn.bigmodel.cn/markdown/1757345118471code.jpg?attname=code.jpg)

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#troubleshooting)  Troubleshooting

Run the following command in your local terminal to verify if it can be installed locally, to troubleshoot environment, permission, and other issues:

Linux/macOS

Windows Cmd

Windows PowerShell

Copy

Ask AI

```
Z_AI_API_KEY=your_api_key npx -y @z_ai/mcp-server
```

- If installed successfully, it indicates that the environment is correct, and the issue may be with the client configuration. Please check the client’s MCP configuration.
- If installation fails, please troubleshoot based on the error message. It is recommended to paste the error message to a large model for analysis and resolution.

Other common issues:

Connection Closed

**Issue：** Mcp server connection closed**Solutions：**

1. Check whether Node.js 22 or a newer version is installed locally.
2. Run `node -v` and `npx -v` to verify that the execution environment is available.
3. Check the environment variable `Z_AI_API_KEY` is configured correctly.

Invalid API Key

**Issue:** Receiving invalid API Key error**Solutions:**

1. Confirm the API Key is correctly copied
2. Check if the API Key is activated
3. Confirm the selected platform (`Z_AI_MODE`) matches the API Key
4. Check if the API Key has sufficient balance

Connection Timeout

**Issue:** MCP server connection timeout**Solutions:**

1. Check network connection
2. Confirm firewall settings
3. Increase timeout settings

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#quota)  Quota

The MCP quotas for the Lite, Pro and Max plans are as follows:

- **Lite:** Include a total of 100 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Pro:** Include a total of 1,000 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.
- **Max:** Include a total of 4,000 web searches and web readers, along with the 5-hour maximum prompt resource pool of the package for vision understanding.

## [​](https://docs.z.ai/devpack/mcp/vision-mcp-server\#related-resources)  Related Resources

- [Model Context Protocol (MCP) Official Documentation](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Configuration Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Z.AI API Reference](https://docs.z.ai/api-reference/introduction)
- [Vision Model Introduction](https://docs.z.ai/guides/vlm/glm-4.6v)

Was this page helpful?

YesNo

[FAQs](https://docs.z.ai/devpack/faq) [Web Search MCP Server](https://docs.z.ai/devpack/mcp/search-mcp-server)

Ctrl+I

[x](https://x.com/Zai_org) [github](https://github.com/zai-org) [discord](https://discord.gg/QR7SARHRxK) [linkedin](https://www.linkedin.com/company/zdotai/)

[Powered by](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=zhipu-32152247)

Assistant

Responses are generated using AI and may contain mistakes.

![Description](https://cdn.bigmodel.cn/markdown/1760501186683image.png?attname=image.png)

![code](https://cdn.bigmodel.cn/markdown/1757345118471code.jpg?attname=code.jpg)