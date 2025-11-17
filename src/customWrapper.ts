/**
 * Custom wrapper for getGzhContent that supports local themes
 *
 * Note: For local themes, we temporarily use a fallback approach.
 * We use 'default' theme and replace its CSS in the generated content.
 */

import { getGzhContent as coreGetGzhContent } from "@wenyan-md/core/wrapper";
import { isLocalTheme, getLocalTheme } from "./themes.js";

export type GzhContent = {
    title: string;
    cover: string;
    content: string;
    description: string;
};

/**
 * Extended getGzhContent that supports both core themes and local themes
 */
export async function getGzhContent(
    content: string,
    themeId: string,
    hlThemeId: string,
    isMacStyle: boolean = false,
    isAddFootnote: boolean = false
): Promise<GzhContent> {
    // If it's a local theme, use a fallback approach
    if (isLocalTheme(themeId)) {
        const theme = getLocalTheme(themeId);
        if (!theme || !theme.getCss) {
            throw new Error(`Local theme ${themeId} not found or has no CSS`);
        }

        // Get the CSS for the local theme
        const themeCss = await theme.getCss();

        // Process with default theme first
        const result = await coreGetGzhContent(content, "default", hlThemeId, isMacStyle, isAddFootnote);

        // Replace the default theme CSS with our local theme CSS
        // The CSS is embedded in a <style> tag in the content
        result.content = result.content.replace(
            /<style[^>]*>[\s\S]*?<\/style>/,
            `<style>${themeCss}</style>`
        );

        return result;
    }

    // Otherwise use the core library's built-in themes
    return coreGetGzhContent(content, themeId, hlThemeId, isMacStyle, isAddFootnote);
}
