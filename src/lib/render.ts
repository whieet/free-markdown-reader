// Markdown render pipeline: builds a markdown-it instance configured with all
// requested plugins and a highlight.js code-block renderer.

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import abbr from 'markdown-it-abbr'
import container from 'markdown-it-container'
import deflist from 'markdown-it-deflist'
import { full as emoji } from 'markdown-it-emoji'
import footnote from 'markdown-it-footnote'
import ins from 'markdown-it-ins'
import mark from 'markdown-it-mark'
import multimdTable from 'markdown-it-multimd-table'
import sub from 'markdown-it-sub'
import sup from 'markdown-it-sup'
import taskLists from 'markdown-it-task-lists'
import toc from 'markdown-it-table-of-contents'
import { katex } from '@mdit/plugin-katex'
import { alert } from '@mdit/plugin-alert'

import { createSlugger } from './slug'
import type { MdPluginKey, Settings } from './storage'

// Strip a leading YAML frontmatter block. CRLF-tolerant; the opening and closing
// `---` must each sit on their own line, and the first body line must contain a
// colon (a YAML mapping). The colon test keeps a leading `---` thematic break
// followed by prose from being eaten, while still stripping CJK / accented /
// quoted keys (e.g. `标题: 你好`) that a `[\w-]+` test would have missed.
const FRONTMATTER = /^---[ \t]*\r?\n[^\r\n]*:[\s\S]*?\r?\n---[ \t]*\r?\n/

export interface RenderResult {
  html: string
  /** Slugs assigned, in document order. */
  slugs: string[]
}

export function createRenderer(settings: Settings) {
  const flags = settings.mdPlugins

  const md: MarkdownIt = new MarkdownIt({
    html: true,
    breaks: false,
    linkify: true,
    xhtmlOut: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      const code = lang && hljs.getLanguage(lang)
        ? hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        : md.utils.escapeHtml(str)
      const label = lang || 'text'
      return (
        `<pre class="md-code hljs"><code class="language-${md.utils.escapeHtml(label)}">` +
        code +
        `</code><button class="md-copy" type="button" data-copy="${encodeURIComponent(str)}" title="Copy">Copy</button></pre>`
      )
    },
  })

  md.linkify.set({ fuzzyEmail: true })

  // Multimd-table is always on; it's a strict superset of stock tables.
  md.use(multimdTable, {
    multiline: true,
    rowspan: true,
    headerless: true,
    multibody: true,
    aotolabel: true,
  })

  if (flags.emoji) md.use(emoji)
  if (flags.sub) md.use(sub)
  if (flags.sup) md.use(sup)
  if (flags.ins) md.use(ins)
  if (flags.mark) md.use(mark)
  if (flags.abbr) md.use(abbr)
  if (flags.deflist) md.use(deflist)
  if (flags.footnote) md.use(footnote)
  if (flags.taskLists) md.use(taskLists, { enabled: true, label: true })
  if (flags.tableOfContents) md.use(toc, { containerClass: 'md-toc' })
  if (flags.container) {
    for (const name of ['info', 'warning', 'tip', 'danger', 'details']) {
      md.use(container, name)
    }
  }
  if (flags.alert) md.use(alert)
  if (flags.katex) md.use(katex, { throwOnError: false, strict: false, output: 'html' })

  // Heading slugs + anchor links. Runs after plugins so plugin-injected
  // headings (e.g. footnotes) get IDs too.
  attachHeadingSlugger(md)

  return {
    render(raw: string): RenderResult {
      const slugs: string[] = []
      // Stash slug collector for the rule below.
      ;(md as MdWithExtras).__slugs = slugs
      const stripped = raw.replace(FRONTMATTER, '')
      const html = md.render(stripped)
      delete (md as MdWithExtras).__slugs
      return { html, slugs }
    },
  }
}

type MdWithExtras = MarkdownIt & { __slugs?: string[] }

function attachHeadingSlugger(md: MarkdownIt) {
  // Assign heading ids at PARSE time (a core rule) so every heading_open token
  // carries its slug before any renderer runs. This lets the [[toc]] plugin —
  // which reads existing id attrs at render time — reuse our exact ids
  // (collision suffixes included) no matter where [[toc]] sits in the document.
  // The default renderer serializes token.attrs, so the id still appears in the
  // output without a custom heading_open renderer rule.
  md.core.ruler.push('heading_slugs', (state) => {
    const slugger = createSlugger()
    const slugs = (md as MdWithExtras).__slugs
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'heading_open') continue
      const inline = tokens[i + 1]
      if (!inline || inline.type !== 'inline') continue
      const id = slugger(inline.content)
      tokens[i].attrSet('id', id)
      slugs?.push(id)
    }
  })
}

export type { MdPluginKey }
