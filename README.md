# Markdown Reader

> A free, MV3 Chrome extension that previews Markdown files (local and web)
> with a full-featured reading experience.
> English | [中文文档](README.zh-CN.md)

## Why

A focused, open-source Markdown reader for Chrome — no paywall, no telemetry,
no account. Built around the features that matter:

- Render `.md` / `.markdown` / `.mkd` / `.mdx` on `file://`, `http://`, and `https://`
- 4-button side panel: **folder** browser • **outline** • **search** • **settings**
- Light / dark / auto themes; centered or full-width layout
- markdown-it plugin set (emoji, sub/sup, ins, mark, abbr, deflist, footnote,
  task lists, multimd-table, containers, alerts, TOC)
- **KaTeX** math and **Mermaid** diagrams
- highlight.js with per-block copy button, image lightbox
- Opt-in **hot reload** (poll the file every 0.5 s)
- Persistent settings via `chrome.storage.local`, with live update across tabs
- Keyboard shortcuts: `Alt+Shift+B/C/R/T`

## Install (developer)

```sh
pnpm install
pnpm build           # writes .output/chrome-mv3
```

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select `.output/chrome-mv3`.
3. Click the extension's **Details** → enable **Allow access to file URLs**
   (required for local `file://` rendering and the folder panel).
4. Open `file:///…/example/index.md` in Chrome to try it.

## Dev loop

```sh
pnpm dev             # live-reloading dev build under .output/chrome-mv3
pnpm check           # svelte-check + tsc
pnpm zip             # produce installable zip
```

## How it works

| Concern | Mechanism |
| ------- | --------- |
| Detect markdown page | URL match (manifest `matches`) + `document.contentType ∈ {text/plain, text/markdown, text/x-markdown}` |
| Harvest raw text | Read the `<pre>` that Chrome already rendered |
| Take over the page | Hide the `<pre>`, mount Svelte app, theme via `data-mdr-theme` |
| Hot reload | Service worker `fetch(tab url)` on a 500 ms `setTimeout` chain; full-text diff |
| Folder browser (`file://`) | Service worker `fetch`es the parent dir; Chrome returns HTML with inline `addRow(...)` calls which we regex-parse defensively |
| Settings | `chrome.storage.local` via WXT's typed `storage.defineItem`; watchers push live updates into every tab and the popup |
| Keyboard shortcuts | `manifest.commands` → SW `chrome.commands` → `tabs.sendMessage` to the active tab |

## Known limits

- **"Allow access to file URLs"** must be enabled by the user; it cannot be
  requested programmatically. Without it, `file://` pages and the folder panel
  are unavailable.
- The folder panel relies on Chrome's internal directory-listing HTML format
  (undocumented). The parser is defensive but may need updates if Chrome
  changes the format.
- Web servers serving `.md` with `text/html` or `application/octet-stream`
  won't trigger the extension (Chrome doesn't expose the file as plain text).

## License

MIT.
