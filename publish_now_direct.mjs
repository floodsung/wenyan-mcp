import { getGzhContent } from "@wenyan-md/core/wrapper";
import { publishToDraft } from "./dist/customPublish.js";
import { readFile } from "fs/promises";

const ARTICLE_PATH = '/home/azureuser/digital_nomad/nomad_articles/20251014_2000_ai_solopreneur_income.md';
const THEME_ID = 'agentera-galaxy';
const AUTHOR = 'AI数字游民编辑部';

(async () => {
  try {
    console.log('🚀 Starting article publication via wenyan-mcp...\n');
    console.log(`📄 Article: ${ARTICLE_PATH}`);
    console.log(`🎨 Theme: ${THEME_ID}`);
    console.log(`✍️  Author: ${AUTHOR}\n`);

    // Read the markdown file
    const content = await readFile(ARTICLE_PATH, "utf-8");

    // Process with wenyan-mcp
    console.log('📝 Processing markdown with theme...');
    const gzhContent = await getGzhContent(content, THEME_ID, "solarized-light", true, true);

    const title = gzhContent.title ?? "Untitled";
    const cover = gzhContent.cover ?? "";

    console.log(`📌 Title: ${title}`);
    console.log(`🖼️  Cover: ${cover ? 'Yes' : 'No'}\n`);

    // Publish to draft
    console.log('📤 Publishing to 公众号草稿箱...');
    const response = await publishToDraft(title, gzhContent.content, cover, AUTHOR);

    console.log('\n✅ SUCCESS!');
    console.log(`   Media ID: ${response.media_id}`);
    console.log(`   Author: ${AUTHOR}`);
    console.log('\n🎉 Article is now in 公众号草稿箱!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
})();
