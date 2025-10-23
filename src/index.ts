#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getGzhContent } from "@wenyan-md/core/wrapper";
import { publishToDraft, publishImageMessageToDraft } from "./customPublish.js";
import { themes, Theme } from "@wenyan-md/core/theme";
import { readFile } from "fs/promises";

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
    {
        name: "wenyan-mcp",
        version: "0.1.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
            // logging: {},
        },
    }
);

/**
 * Handler that lists available tools.
 * Exposes a single "publish_article" tool that lets clients publish new article.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "publish_article_from_file",
                description:
                    "Read a Markdown file from the given path and publish it to '微信公众号'. The file should contain frontmatter with title and optional cover.",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: {
                            type: "string",
                            description: "Absolute path to the Markdown file to publish.",
                        },
                        theme_id: {
                            type: "string",
                            description:
                                "ID of the theme to use (e.g., default, orangeheart, rainbow, lapis, pie, maize, purple, phycat, agentera, agentera-orange, agentera-blue, agentera-cyan, agentera-rose, agentera-galaxy, agentera-mint).",
                        },
                        author: {
                            type: "string",
                            description: "Author name for the article. Defaults to 'Flood Sung' if not specified.",
                        },
                    },
                    required: ["file_path"],
                },
            },
            {
                name: "list_themes",
                description:
                    "List the themes compatible with the 'publish_article_from_file' tool to publish an article to '微信公众号'.",
                inputSchema: {
                    type: "object",
                    properties: {}
                },
            },
            {
                name: "publish_image_message",
                description:
                    "Publish an image message (图片消息) to WeChat Official Account draft box. This creates a visual gallery-style message with up to 20 images.",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "Title of the image message.",
                        },
                        content: {
                            type: "string",
                            description: "Description or caption for the image message (max 20,000 characters).",
                        },
                        image_paths: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Array of image paths (local absolute paths or URLs). Min 1, max 20 images. First image will be the cover.",
                        },
                        need_open_comment: {
                            type: "boolean",
                            description: "Whether to enable comments. Defaults to true.",
                        },
                        only_fans_can_comment: {
                            type: "boolean",
                            description: "Whether only fans can comment. Defaults to false.",
                        },
                    },
                    required: ["title", "content", "image_paths"],
                },
            },
        ],
    };
});

/**
 * Handler for the tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "publish_article_from_file") {
        const filePath = String(request.params.arguments?.file_path || "");
        const themeId = String(request.params.arguments?.theme_id || "");
        const author = String(request.params.arguments?.author || "");

        if (!filePath) {
            throw new Error("file_path is required");
        }

        try {
            // Read the markdown file
            const content = await readFile(filePath, "utf-8");

            // Process and publish using the same logic as publish_article
            const gzhContent = await getGzhContent(content, themeId, "solarized-light", true, true);
            const title = gzhContent.title ?? "this is title";
            const cover = gzhContent.cover ?? "";
            const response = await publishToDraft(title, gzhContent.content, cover, author);

            return {
                content: [
                    {
                        type: "text",
                        text: `Article from file '${filePath}' was successfully published to '公众号草稿箱'. The media ID is ${response.media_id}. Author: ${author || "Flood Sung"}. Comments are enabled.`,
                    },
                ],
            };
        } catch (error) {
            throw new Error(`Failed to read or publish file: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else if (request.params.name === "list_themes") {
        const themeResources = Object.entries(themes).map(([id, theme]: [string, Theme]) => ({
            type: "text",
            text: JSON.stringify({
                id: theme.id,
                name: theme.name,
                description: theme.description
            }),
        }));
        return {
            content: themeResources,
        };
    } else if (request.params.name === "publish_image_message") {
        const title = String(request.params.arguments?.title || "");
        const content = String(request.params.arguments?.content || "");
        const imagePaths = request.params.arguments?.image_paths as string[] || [];
        const needOpenComment = request.params.arguments?.need_open_comment !== undefined
            ? Boolean(request.params.arguments.need_open_comment)
            : true;
        const onlyFansCanComment = request.params.arguments?.only_fans_can_comment !== undefined
            ? Boolean(request.params.arguments.only_fans_can_comment)
            : false;

        if (!title || !content) {
            throw new Error("title and content are required");
        }

        if (!imagePaths || imagePaths.length === 0) {
            throw new Error("image_paths is required and must contain at least one image");
        }

        try {
            const response = await publishImageMessageToDraft(
                title,
                content,
                imagePaths,
                needOpenComment,
                onlyFansCanComment
            );

            return {
                content: [
                    {
                        type: "text",
                        text: `Image message successfully added to draft box. Media ID: ${response.media_id}. Total images: ${imagePaths.length}.`,
                    },
                ],
            };
        } catch (error) {
            throw new Error(`Failed to publish image message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    throw new Error("Unknown tool");
});


/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
