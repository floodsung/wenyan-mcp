---
title: 测试文章：使用文颜MCP发布公众号文章
cover: https://cdn.phycat.cn/localediter/202312081856475.png
---

# 测试文章：使用文颜MCP发布公众号文章

这是一篇测试文章，演示如何使用新的 `publish_article_from_file` 工具直接从Markdown文件发布到微信公众号。

## 新工具的优势

使用 `publish_article_from_file` 工具，你只需要提供文件路径，工具会自动：

1. 读取Markdown文件内容
2. 解析frontmatter元数据（title和cover）
3. 应用指定的主题样式
4. 上传图片到微信服务器
5. 发布到公众号草稿箱

## 使用示例

```markdown
# 调用新工具
mcp__wenyan-mcp__publish_article_from_file({
  file_path: "/path/to/your/article.md",
  theme_id: "pie"
})
```

## 支持的功能

- **代码高亮**: 支持多种编程语言语法高亮
- **数学公式**: 支持LaTeX数学公式渲染 $E=mc^2$
- **图片上传**: 自动上传本地和网络图片
- **多种主题**: 支持8种精美主题样式

![示例图片](https://cdn.phycat.cn/localediter/202312081856475.png)
*图1: 测试二维码*

## 结论

这个新工具让AI助手能够更方便地管理和发布公众号文章，无需手动复制粘贴内容。
