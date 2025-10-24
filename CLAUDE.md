# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wenyan MCP Server (文颜 MCP Server) is a Model Context Protocol (MCP) server that enables AI assistants to format Markdown articles with elegant themes and publish them directly to WeChat Official Account (微信公众号) drafts. It's part of the Wenyan ecosystem of Markdown publishing tools.

**Package**: `@wenyan-md/mcp`
**Core Dependency**: `@wenyan-md/core` (handles theme rendering and markdown processing)

## Common Commands

### Build & Development
```bash
# Build the project
npm run build
# or
npx tsc -b

# Watch mode for development
npm run watch

# Run tests
npm test
# or
pnpx vitest run
```

### Debugging
```bash
# Launch MCP Inspector for debugging
npm run inspector

# Or manually:
npx @modelcontextprotocol/inspector
```

The inspector provides a web UI to test MCP tools with proper authentication tokens.

### Publishing
```bash
# Prepare for npm publish (runs build automatically)
npm run prepublishOnly
```

## Architecture

### Core Components

1. **src/index.ts** - Main MCP server entry point
   - Implements MCP Server using `@modelcontextprotocol/sdk`
   - Exposes three tools: `publish_article`, `publish_article_from_file`, `list_themes`
   - Uses stdio transport for communication with MCP clients
   - Delegates to `@wenyan-md/core` for markdown processing and theme application
   - Calls `customPublish.ts` for WeChat API integration

2. **src/customPublish.ts** - WeChat publishing logic
   - Handles WeChat API authentication (access token fetching)
   - Uploads images to WeChat (supports local paths and URLs)
   - Processes HTML content and replaces image sources with WeChat media URLs
   - Creates draft articles via WeChat Draft API
   - Environment-dependent: requires `WECHAT_APP_ID` and `WECHAT_APP_SECRET`
   - Docker-specific: uses `HOST_IMAGE_PATH` mapping for containerized local image access

### Key Architecture Patterns

- **MCP Tool Pattern**: Tools are registered via `setRequestHandler(ListToolsRequestSchema)` and executed via `setRequestHandler(CallToolRequestSchema)`
- **Theme System**: Themes are imported from `@wenyan-md/core/theme` - the core library manages theme CSS and markdown rendering
- **Image Upload Flow**:
  1. Parse HTML content for `<img>` tags
  2. Upload images to WeChat (skip if already hosted on `mmbiz.qpic.cn`)
  3. Replace `src` attributes with WeChat CDN URLs
  4. Determine cover image (explicit cover > first content image)
- **Docker Path Mapping**: Local images use `HOST_IMAGE_PATH` on host, mapped to `/mnt/host-downloads` in container

### Environment Variables

Required for publishing to WeChat:
- `WECHAT_APP_ID` - WeChat Official Account App ID
- `WECHAT_APP_SECRET` - WeChat Official Account App Secret
- `HOST_IMAGE_PATH` - (Docker only) Host path for local images

### Frontmatter Requirements

Markdown articles must include frontmatter:
```md
---
title: Article Title (required)
cover: /path/to/cover.jpg (optional if article contains images)
---
```

### Available Tools

### 1. `publish_article_from_file`
Read Markdown file and publish to WeChat draft box.
- **Parameters**: `file_path` (absolute path), `theme_id` (optional), `author` (optional)
- **Returns**: `media_id` for the created draft

### 2. `publish_image_message`
Create image gallery message (图片消息) in draft box.
- **Parameters**: `title`, `content`, `image_paths` (array, 1-20 images), `need_open_comment` (optional), `only_fans_can_comment` (optional)
- **Returns**: `media_id` for the created draft
- **Note**: Uses WeChat `draft/add` API with `article_type: "newspic"`

### 3. `list_themes`
List all available themes for `publish_article_from_file` tool.
- **Returns**: Array of theme objects with `id`, `name`, `description`

## Available Themes

**Recommended Theme IDs (Agentera Series)**: `agentera-orange`, `agentera-blue`, `agentera-cyan`, `agentera-rose`, `agentera-galaxy`, `agentera-mint`

**Legacy Theme IDs** (still available but not recommended): `default`, `orangeheart`, `rainbow`, `lapis`, `pie`, `maize`, `purple`, `phycat`

Themes are managed by `@wenyan-md/core` library - theme CSS files are not in this repository.

## TypeScript Configuration

- **Target**: ESNext
- **Module System**: NodeNext (native ESM)
- **Output**: `dist/` directory
- **Source**: `src/` directory only
- **Strict Mode**: Enabled (except `noImplicitAny: false`)

## Testing

Test files live in root directory (prefixed `test_*.mjs`) and `test/` directory. Tests use Vitest framework.

## Docker Support

Dockerfile provided for containerized deployment. Key considerations:
- Volume mount required for local image access: `-v /host/path:/mnt/host-downloads`
- Environment variables must be injected via `-e` flags
- Images outside mounted directory cannot be accessed by container
