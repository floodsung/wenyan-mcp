#!/usr/bin/env node

/**
 * Final publish script using wenyan-mcp's customPublish module
 */

import { readFile } from 'fs/promises';
import { getGzhContent } from '@wenyan-md/core/wrapper';
import { publishToDraft } from './dist/customPublish.js';

// Set environment variables
process.env.WECHAT_APP_ID = 'wxdfd7e204f882a185';
process.env.WECHAT_APP_SECRET = 'eb5867d82c9481a96277c6ae38d6e112';

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
    console.log('🖼️  Cover:', cover || '(using first image in content)');

    console.log('\n📤 Publishing to 草稿箱...');
    const response = await publishToDraft(title, gzhContent.content, cover, '数字游民观察');

    console.log('\n✅ SUCCESS! Article published to 草稿箱');
    console.log('📋 Media ID:', response.media_id);
    console.log('\n🎉 请登录微信公众号后台查看草稿箱！');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
