/**
 * Theme definitions for wenyan-mcp
 * Includes Agentera theme series
 */

import agenteraOrange from "./themes/agentera-orange-theme.js";
import agenteraBlue from "./themes/agentera-blue-theme.js";
import agenteraCyan from "./themes/agentera-cyan-theme.js";
import agenteraRose from "./themes/agentera-rose-theme.js";
import agenteraGalaxy from "./themes/agentera-galaxy-theme.js";
import agenteraMint from "./themes/agentera-mint-theme.js";
import agentera from "./themes/agentera-theme.js";

export interface Theme {
    id: string;
    name: string;
    description: string;
    appName: string;
    author: string;
    getCss: () => Promise<string>;
}

const agenteraThemes: Theme[] = [
    {
        id: "agentera",
        name: "AgentEra",
        description: "A futuristic, cyberpunk-inspired tech theme perfect for AI and tech content.",
        appName: "Agent时代",
        author: "agent时代公众号",
        getCss: async () => agentera.default || agentera
    },
    {
        id: "agentera-orange",
        name: "AgentEra Orange",
        description: "A modern light theme with warm orange-gold tech headings and vibrant style.",
        appName: "Agent时代-橙金版",
        author: "agent时代公众号",
        getCss: async () => agenteraOrange.default || agenteraOrange
    },
    {
        id: "agentera-blue",
        name: "AgentEra Blue",
        description: "A modern light theme with blue-purple tech headings and professional style.",
        appName: "Agent时代-蓝紫版",
        author: "agent时代公众号",
        getCss: async () => agenteraBlue.default || agenteraBlue
    },
    {
        id: "agentera-cyan",
        name: "AgentEra Cyan",
        description: "A modern light theme with cyan-green neon headings and vibrant style.",
        appName: "Agent时代-青绿版",
        author: "agent时代公众号",
        getCss: async () => agenteraCyan.default || agenteraCyan
    },
    {
        id: "agentera-rose",
        name: "AgentEra Rose",
        description: "A modern light theme with rose gold headings and elegant style.",
        appName: "Agent时代-玫瑰金版",
        author: "agent时代公众号",
        getCss: async () => agenteraRose.default || agenteraRose
    },
    {
        id: "agentera-galaxy",
        name: "AgentEra Galaxy",
        description: "A modern light theme with deep blue galaxy headings and mysterious style.",
        appName: "Agent时代-银河版",
        author: "agent时代公众号",
        getCss: async () => agenteraGalaxy.default || agenteraGalaxy
    },
    {
        id: "agentera-mint",
        name: "AgentEra Mint",
        description: "A modern light theme with mint fresh headings and refreshing style.",
        appName: "Agent时代-薄荷版",
        author: "agent时代公众号",
        getCss: async () => agenteraMint.default || agenteraMint
    }
];

// Create a map of themes by ID for quick lookup
export const localThemes: Record<string, Theme> = Object.fromEntries(
    agenteraThemes.map(theme => [theme.id, theme])
);

// Export list of all local themes
export function getAllLocalThemes(): Theme[] {
    return agenteraThemes;
}

// Check if a theme ID is a local theme
export function isLocalTheme(themeId: string): boolean {
    return themeId in localThemes;
}

// Get a local theme by ID
export function getLocalTheme(themeId: string): Theme | undefined {
    return localThemes[themeId];
}
