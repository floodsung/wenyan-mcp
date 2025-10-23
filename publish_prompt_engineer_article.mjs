import { getGzhContent } from "@wenyan-md/core/wrapper";
import { publishToDraft } from "./dist/customPublish.js";
import { readFile } from "fs/promises";

// Set WeChat credentials
process.env.WECHAT_APP_ID = 'wxdfd7e204f882a185';
process.env.WECHAT_APP_SECRET = 'eb5867d82c9481a96277c6ae38d6e112';

const ARTICLE_PATH = '/home/azureuser/digital_nomad/nomad_articles/20251015_prompt_engineer_remote_career.md';
const THEME_ID = 'agentera-orange';  // 橙金科技风，适合AI职业话题
const AUTHOR = 'AI数字游民编辑部';

(async () => {
  try {
    console.log('🚀 Starting Prompt Engineer article publication...\n');
    console.log(`📄 Article: ${ARTICLE_PATH}`);
    console.log(`🎨 Theme: ${THEME_ID}`);
    console.log(`✍️  Author: ${AUTHOR}\n`);

    // Read the markdown file
    const content = await readFile(ARTICLE_PATH, "utf-8");
    console.log(`✓ Article loaded (${content.length} characters)\n`);

    // Process with wenyan-mcp
    console.log('📝 Processing markdown with AgentEra Orange theme...');
    const gzhContent = await getGzhContent(content, THEME_ID, "solarized-light", true, true);

    const title = gzhContent.title ?? "Untitled";
    const cover = gzhContent.cover ?? "";

    console.log(`📌 Title: ${title}`);
    console.log(`🖼️  Cover: ${cover ? 'Found' : 'Not found'}\n`);

    // Publish to draft
    console.log('📤 Publishing to 公众号草稿箱...');
    const response = await publishToDraft(title, gzhContent.content, cover, AUTHOR);

    console.log('\n✅ SUCCESS!');
    console.log(`   Media ID: ${response.media_id}`);
    console.log(`   Title: ${title}`);
    console.log(`   Author: ${AUTHOR}`);
    console.log(`   Theme: ${THEME_ID}`);
    console.log('\n🎉 Prompt Engineer article is now in 公众号草稿箱!');
    console.log('   You can now preview and publish it from the WeChat Official Account backend.');

  } catch (error) {
    console.error('\n❌ Publication failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
})();
