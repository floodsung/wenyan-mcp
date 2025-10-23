#!/usr/bin/env node

/**
 * Direct publish script using wenyan-mcp's core functions
 */

import { readFile } from 'fs/promises';
import { getGzhContent } from '@wenyan-md/core/wrapper';
import https from 'https';

const APPID = 'wxdfd7e204f882a185';
const APPSECRET = 'eb5867d82c9481a96277c6ae38d6e112';

// Get access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.access_token) {
          resolve(result.access_token);
        } else {
          reject(new Error('Failed to get access token: ' + JSON.stringify(result)));
        }
      });
    }).on('error', reject);
  });
}

// Publish to draft
async function publishToDraft(title, content, thumbMediaId, author) {
  const accessToken = await getAccessToken();

  const article = {
    articles: [{
      title: title,
      author: author || '数字游民观察',
      digest: title.substring(0, 54),
      content: content,
      content_source_url: '',
      thumb_media_id: thumbMediaId,
      need_open_comment: 1,
      only_fans_can_comment: 0
    }]
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(article);
    const req = https.request({
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/draft/add?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.media_id) {
          resolve(result);
        } else {
          reject(new Error('Failed to create draft: ' + JSON.stringify(result)));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    const mdPath = '/home/azureuser/digital_nomad/nomad_articles/20251017_1900_best_nomad_destinations_2025.md';
    const themeId = 'agentera-blue';

    console.log('📖 Reading article:', mdPath);
    const content = await readFile(mdPath, 'utf-8');

    console.log('🎨 Processing with theme:', themeId);
    const gzhContent = await getGzhContent(content, themeId, 'solarized-light', true, true);

    const title = gzhContent.title || '2025全球数字游民目的地排名';
    const cover = gzhContent.cover || '';

    console.log('📝 Title:', title);
    console.log('🖼️  Cover:', cover ? 'Yes' : 'No');

    console.log('\n📤 Publishing to 草稿箱...');
    const response = await publishToDraft(title, gzhContent.content, cover, '数字游民观察');

    console.log('\n✅ SUCCESS! Article published to 草稿箱');
    console.log('📋 Media ID:', response.media_id);
    console.log('\n请登录微信公众号后台查看草稿箱');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

main();
