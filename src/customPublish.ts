/**
 * Custom publish module that extends the functionality of @wenyan-md/core
 * Adds support for author, comments, and other draft parameters
 */

import { JSDOM } from "jsdom";
import { fileFromPath } from "formdata-node/file-from-path";
import { Blob } from "formdata-node";
import { FormData } from "formdata-node";
import path from "path";

const TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
const DRAFT_ADD_URL = "https://api.weixin.qq.com/cgi-bin/draft/add";
const MATERIAL_ADD_URL = "https://api.weixin.qq.com/cgi-bin/material/add_material";

// Environment variables
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || "";
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || "";
const HOST_IMAGE_PATH = process.env.HOST_IMAGE_PATH || "";
const HOST_DOWNLOAD_PATH = "/mnt/host-downloads";

/**
 * Fetch WeChat access token
 */
async function fetchAccessToken(): Promise<any> {
    const response = await fetch(
        `${TOKEN_URL}?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取AccessToken失败: ${response.status} ${errorText}`);
    }

    return await response.json();
}

/**
 * Upload material to WeChat
 */
async function uploadMaterial(
    type: string,
    fileData: Blob | any,
    fileName: string,
    accessToken: string
): Promise<any> {
    const formData = new FormData();
    formData.append("media", fileData, fileName);

    const response = await fetch(`${MATERIAL_ADD_URL}?access_token=${accessToken}&type=${type}`, {
        method: "POST",
        body: formData as any,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`上传素材失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // Convert http to https if needed
    if (result.url && result.url.startsWith("http://")) {
        result.url = result.url.replace("http://", "https://");
    }

    return result;
}

interface ArticleOptions {
    title: string;
    content: string;
    thumbMediaId: string;
    author?: string;
    needOpenComment?: boolean;
    onlyFansCanComment?: boolean;
    digest?: string;
    contentSourceUrl?: string;
}

/**
 * Upload image to WeChat and return media_id
 */
async function uploadImage(imagePath: string, accessToken: string, fileName?: string): Promise<any> {
    let fileData: Blob | any;
    let realFileName: string;

    if (imagePath.startsWith("http")) {
        // Download from URL
        const response = await fetch(imagePath);
        if (!response.ok || !response.body) {
            throw new Error(`Failed to download image from URL: ${imagePath}`);
        }
        const basename = path.basename(imagePath.split("?")[0]);
        const ext = path.extname(basename);
        realFileName = fileName ?? (ext === "" ? `${basename}.jpg` : basename);
        const arrayBuffer = await response.arrayBuffer();
        fileData = new Blob([arrayBuffer]);
    } else {
        // Local file
        const localPath = HOST_IMAGE_PATH ? imagePath.replace(HOST_IMAGE_PATH, HOST_DOWNLOAD_PATH) : imagePath;
        const basename = path.basename(localPath);
        const ext = path.extname(basename);
        realFileName = fileName ?? (ext === "" ? `${basename}.jpg` : basename);
        fileData = await fileFromPath(imagePath);
    }

    const result = await uploadMaterial("image", fileData, realFileName, accessToken);

    if (result.errcode) {
        throw new Error(`上传失败，错误码：${result.errcode}，错误信息：${result.errmsg}`);
    }

    return result;
}

/**
 * Process HTML content and upload images
 */
async function processImages(html: string, accessToken: string): Promise<{ html: string; firstImageId: string }> {
    if (!html.includes("<img")) {
        return { html, firstImageId: "" };
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const images = Array.from(document.querySelectorAll("img")) as Element[];

    const uploadPromises = images.map(async (img) => {
        const src = img.getAttribute("src");
        if (src) {
            // Skip if already uploaded to WeChat
            if (src.startsWith("https://mmbiz.qpic.cn")) {
                return src;
            } else {
                const result = await uploadImage(src, accessToken);
                img.setAttribute("src", result.url);
                return result.media_id;
            }
        }
        return null;
    });

    const results = await Promise.all(uploadPromises);
    const firstImageId = results.filter(Boolean)[0] || "";

    return { html: dom.serialize(), firstImageId };
}

/**
 * Publish article to draft with extended options
 */
export async function publishToDraftWithOptions(options: ArticleOptions): Promise<any> {
    // Get access token
    const tokenResponse = await fetchAccessToken();
    if (!tokenResponse.access_token) {
        throw tokenResponse.errcode
            ? new Error(`获取 Access Token 失败，错误码：${tokenResponse.errcode}，${tokenResponse.errmsg}`)
            : new Error(`获取 Access Token 失败: ${tokenResponse}`);
    }

    const accessToken = tokenResponse.access_token;

    // Clean up content (remove newlines in lists)
    const cleanedContent = options.content
        .replace(/\n<li/g, "<li")
        .replace(/<\/li>\n/g, "</li>");

    // Process images in content
    const { html, firstImageId } = await processImages(cleanedContent, accessToken);

    // Determine thumb_media_id
    let thumbMediaId = "";
    if (options.thumbMediaId) {
        // Use provided cover
        thumbMediaId = (await uploadImage(options.thumbMediaId, accessToken, "cover.jpg")).media_id;
    } else if (firstImageId.startsWith("https://mmbiz.qpic.cn")) {
        // First image is a URL, need to upload
        thumbMediaId = (await uploadImage(firstImageId, accessToken, "cover.jpg")).media_id;
    } else {
        // Use first image's media_id
        thumbMediaId = firstImageId;
    }

    if (!thumbMediaId) {
        throw new Error("你必须指定一张封面图或者在正文中至少出现一张图片。");
    }

    // Build article data with extended parameters
    const articleData = {
        articles: [
            {
                title: options.title,
                content: html,
                thumb_media_id: thumbMediaId,
                author: options.author || "Flood Sung",
                need_open_comment: options.needOpenComment !== undefined ? (options.needOpenComment ? 1 : 0) : 1,
                only_fans_can_comment: options.onlyFansCanComment !== undefined ? (options.onlyFansCanComment ? 1 : 0) : 0,
                ...(options.digest && { digest: options.digest }),
                ...(options.contentSourceUrl && { content_source_url: options.contentSourceUrl }),
            },
        ],
    };

    // Call WeChat API
    const response = await fetch(`${DRAFT_ADD_URL}?access_token=${accessToken}`, {
        method: "POST",
        body: JSON.stringify(articleData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`发布失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.media_id) {
        return result;
    }

    throw result.errcode
        ? new Error(`上传到公众号草稿失败，错误码：${result.errcode}，${result.errmsg}`)
        : new Error(`上传到公众号草稿失败: ${result}`);
}

/**
 * Simplified wrapper that uses default options
 */
export async function publishToDraft(
    title: string,
    content: string,
    cover: string,
    author?: string
): Promise<any> {
    return publishToDraftWithOptions({
        title,
        content,
        thumbMediaId: cover,
        author: author || "Flood Sung",
        needOpenComment: true,
        onlyFansCanComment: false,
    });
}

/**
 * Publish an image message (newspic) to draft box
 * @param title - Message title
 * @param content - Message content
 * @param imagePaths - Array of image paths (local or URL), max 20 images
 * @param needOpenComment - Whether to enable comments (default: true)
 * @param onlyFansCanComment - Whether only fans can comment (default: false)
 * @returns Draft result with media_id
 */
export async function publishImageMessageToDraft(
    title: string,
    content: string,
    imagePaths: string[],
    needOpenComment: boolean = true,
    onlyFansCanComment: boolean = false
): Promise<any> {
    if (!imagePaths || imagePaths.length === 0) {
        throw new Error("至少需要一张图片");
    }

    if (imagePaths.length > 20) {
        throw new Error("图片数量不能超过20张");
    }

    // Get access token
    const tokenResponse = await fetchAccessToken();
    if (!tokenResponse.access_token) {
        throw tokenResponse.errcode
            ? new Error(`获取 Access Token 失败，错误码：${tokenResponse.errcode}，${tokenResponse.errmsg}`)
            : new Error(`获取 Access Token 失败: ${tokenResponse}`);
    }

    const accessToken = tokenResponse.access_token;

    // Upload all images and get their media_ids
    const uploadPromises = imagePaths.map(async (imagePath) => {
        const result = await uploadMaterial("image",
            imagePath.startsWith("http")
                ? new Blob([await (await fetch(imagePath)).arrayBuffer()])
                : await fileFromPath(imagePath),
            path.basename(imagePath),
            accessToken
        );
        return result.media_id;
    });

    const mediaIds = await Promise.all(uploadPromises);

    // Build image_list
    const imageList = mediaIds.map((mediaId) => ({
        image_media_id: mediaId,
    }));

    // Build draft data
    const draftData = {
        articles: [
            {
                article_type: "newspic",
                title: title,
                content: content,
                image_info: {
                    image_list: imageList,
                },
                need_open_comment: needOpenComment ? 1 : 0,
                only_fans_can_comment: onlyFansCanComment ? 1 : 0,
            },
        ],
    };

    // Call WeChat draft/add API
    const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(draftData),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`添加图片消息草稿失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.media_id) {
        return result;
    }

    throw result.errcode
        ? new Error(`添加图片消息草稿失败，错误码：${result.errcode}，${result.errmsg}`)
        : new Error(`添加图片消息草稿失败: ${result}`);
}

