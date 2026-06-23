---
title: Markdown Reader test page
date: 2026-06-23
---

# Welcome to Markdown Reader

This file exercises every feature of the extension. Open it from your
filesystem (drag into Chrome, or `file:///…/example/index.md`).

## Why this extension

- Renders local `.md`/`.mkd`/`.mdx`/`.markdown` files
- Sibling-file **folder browser**
- **Outline**, **search**, and live settings panels
- Light / dark / auto themes
- KaTeX math, Mermaid diagrams, syntax highlighting

> Built as a free, open-source Markdown reader extension.

## Code highlighting

```ts
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

## Tables

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Folder  | ✅     | file:// only |
| Outline | ✅     | scroll-spy |
| Search  | ✅     | next/prev nav |
| Hot reload | ✅  | opt-in (popup) |

## Task list

- [x] Render markdown
- [x] Outline panel
- [x] Folder panel
- [ ] Your custom theme

## Math

Inline: $E = mc^2$ and $\int_0^\infty e^{-x^2}\,dx = \tfrac{\sqrt{\pi}}{2}$.

Block:

$$
\frac{1}{\pi} \int_0^\pi \cos(n\theta) \, d\theta
= \begin{cases} 1 & n = 0 \\ 0 & n \ne 0 \end{cases}
$$

## Diagram

```mermaid
flowchart LR
    A[Markdown source] --> B(markdown-it + plugins)
    B --> C{Rendered}
    C --> D[Outline]
    C --> E[Folder]
    C --> F[Search]
```

## Mindmap (思维导图)

```mermaid
mindmap
  root((Markdown Reader))
    渲染
      markdown-it
      highlight.js
      KaTeX
      Mermaid
    面板
      Folder
      Outline
      Search
      Settings
    主题
      Light
      Dark
      Auto
    交互
      Hot reload
      快捷键
      Raw 切换
```

## Timeline (时间线)

```mermaid
timeline
    title Markdown 渲染器演进
    2004 : Markdown 诞生
    2009 : marked.js 发布
    2014 : markdown-it 出现
    2026 : Markdown Reader (本扩展)
```

## Sequence (时序图)

```mermaid
sequenceDiagram
    User->>Chrome: 打开 .md 文件
    Chrome->>Extension: 注入 content script
    Extension->>Extension: 读取 <pre>
    Extension->>Page: 渲染 HTML + 挂载面板
    Extension-->>User: 完美呈现
```

## Footnotes, emoji, sub/sup

This sentence has a footnote.[^1] Emoji: :rocket: :sparkles:.
Water is H~2~O. Einstein wrote E=mc^2^.

[^1]: Footnotes are rendered at the bottom.

## Alerts

> [!NOTE]
> Useful information that users should know.

> [!WARNING]
> Critical content that could lead to data loss.

## Image

![A small placeholder](https://placehold.co/600x200/0969da/ffffff?text=Markdown+Reader)

— end of file
