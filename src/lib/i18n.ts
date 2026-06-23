// Simple i18n: messages bundled in TS, current language driven by settings.
// All UI strings live here so adding a language is one block.

import { browser } from 'wxt/browser'

export const SUPPORTED_LANGS = ['en', 'zh_CN'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  zh_CN: '简体中文',
}

type Dict = Record<string, string>

const en: Dict = {
  // Toolbar
  'panel.folder': 'Folder',
  'panel.outline': 'Outline',
  'panel.search': 'Search',
  'panel.settings': 'Settings',

  // Outline
  'outline.empty': 'No headings in this document.',

  // Folder
  'folder.notFile': 'The folder browser is available only for local file:// documents.',
  'folder.needFileAccess':
    'Allow file URL access for this extension at chrome://extensions → toggle "Allow access to file URLs", then reload this page.',
  'folder.loading': 'Loading…',
  'folder.empty': 'No markdown files in this folder.',

  // Search
  'search.placeholder': 'Find in document…',
  'search.noMatches': 'No matches',

  // Settings
  'settings.enable': 'Enable rendering',
  'settings.centered': 'Centered layout',
  'settings.refresh': 'Hot reload (poll file)',
  'settings.theme': 'Theme',
  'settings.theme.auto': 'auto',
  'settings.theme.light': 'light',
  'settings.theme.dark': 'dark',
  'settings.language': 'Language',
  'settings.plugins': 'Markdown plugins',
  'settings.shortcuts': 'Shortcuts',
  'settings.shortcut.togglePanel': 'Toggle side panel',
  'settings.shortcut.toggleCentered': 'Toggle centered',
  'settings.shortcut.toggleRefresh': 'Toggle hot reload',
  'settings.shortcut.toggleTheme': 'Toggle theme',
  'settings.fileAccessWarning':
    'Local file:// support is disabled. Open chrome://extensions, find Markdown Reader, and enable "Allow access to file URLs".',

  // Plugin labels
  'plugin.emoji': 'Emoji',
  'plugin.sub': 'Subscript',
  'plugin.sup': 'Superscript',
  'plugin.ins': 'Insertions',
  'plugin.mark': 'Highlight',
  'plugin.abbr': 'Abbreviations',
  'plugin.deflist': 'Definition lists',
  'plugin.footnote': 'Footnotes',
  'plugin.taskLists': 'Task lists',
  'plugin.tableOfContents': '[[toc]]',
  'plugin.container': 'Containers',
  'plugin.alert': 'Alerts',
  'plugin.katex': 'Math (KaTeX)',
  'plugin.mermaid': 'Mermaid diagrams',
}

const zh_CN: Dict = {
  'panel.folder': '文件夹',
  'panel.outline': '大纲',
  'panel.search': '搜索',
  'panel.settings': '设置',

  'outline.empty': '该文档没有标题。',

  'folder.notFile': '文件夹浏览仅适用于本地 file:// 文档。',
  'folder.needFileAccess':
    '请在 chrome://extensions 中为本扩展打开"允许访问文件网址"，然后刷新页面。',
  'folder.loading': '加载中…',
  'folder.empty': '该文件夹中没有 Markdown 文件。',

  'search.placeholder': '在文档中查找…',
  'search.noMatches': '无匹配',

  'settings.enable': '启用渲染',
  'settings.centered': '居中布局',
  'settings.refresh': '热重载（轮询文件）',
  'settings.theme': '主题',
  'settings.theme.auto': '自动',
  'settings.theme.light': '浅色',
  'settings.theme.dark': '深色',
  'settings.language': '语言',
  'settings.plugins': 'Markdown 插件',
  'settings.shortcuts': '快捷键',
  'settings.shortcut.togglePanel': '切换侧栏',
  'settings.shortcut.toggleCentered': '切换居中',
  'settings.shortcut.toggleRefresh': '切换热重载',
  'settings.shortcut.toggleTheme': '切换主题',
  'settings.fileAccessWarning':
    '本地 file:// 支持已关闭。请打开 chrome://extensions，找到 Markdown 阅读器，并启用"允许访问文件网址"。',

  'plugin.emoji': '表情符号',
  'plugin.sub': '下标',
  'plugin.sup': '上标',
  'plugin.ins': '插入文本',
  'plugin.mark': '高亮',
  'plugin.abbr': '缩写',
  'plugin.deflist': '定义列表',
  'plugin.footnote': '脚注',
  'plugin.taskLists': '任务列表',
  'plugin.tableOfContents': '[[toc]] 目录',
  'plugin.container': '自定义容器',
  'plugin.alert': '提示框',
  'plugin.katex': '数学公式 (KaTeX)',
  'plugin.mermaid': 'Mermaid 图表',
}

const MESSAGES: Record<Lang, Dict> = { en, zh_CN }

/** Look up a translation; falls back to English then to the key itself. */
export function t(lang: Lang, key: string): string {
  return MESSAGES[lang]?.[key] ?? MESSAGES.en[key] ?? key
}

/** Detect the user's preferred UI language from the browser/system. */
export function detectLanguage(): Lang {
  let raw = ''
  try {
    raw = browser.i18n?.getUILanguage?.() ?? ''
  } catch {
    /* not available in some contexts */
  }
  if (!raw) raw = (navigator.language || '').toString()
  const lower = raw.toLowerCase()
  if (lower.startsWith('zh')) return 'zh_CN'
  return 'en'
}
