import { defineConfig } from 'wxt'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Chrome's content-script loader rejects files containing Unicode
// "noncharacters" (U+FFFE, U+FFFF, U+FDD0…U+FDEF, U+xFFFE/U+xFFFF for x=1..16)
// with a misleading "isn't UTF-8 encoded" error. markdown-it / linkify bake
// some of these into their compiled regex character classes. We walk the
// build output and escape them — safe inside JS string and regex literals.
const NONCHAR = /[﷐-﷯￾￿]/g
function escapeNonchars(s: string): string {
  return s.replace(NONCHAR, (c) => {
    const cp = c.codePointAt(0)!
    return '\\u' + cp.toString(16).padStart(4, '0').toUpperCase()
  })
}
function walkJs(dir: string, cb: (file: string) => void) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walkJs(full, cb)
    else if (entry.endsWith('.js') || entry.endsWith('.mjs')) cb(full)
  }
}

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Markdown Reader',
    description:
      'Preview Markdown files (local & web) with TOC, folder browser, search, themes, math, diagrams and hot reload.',
    version: '1.0.0',
    default_locale: 'en',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://*/*'],
    action: {
      default_title: 'Markdown Reader',
    },
    commands: {
      'toggle-panel': {
        suggested_key: { default: 'Alt+Shift+B' },
        description: 'Toggle the side panel',
      },
      'toggle-centered': {
        suggested_key: { default: 'Alt+Shift+C' },
        description: 'Toggle centered layout',
      },
      'toggle-refresh': {
        suggested_key: { default: 'Alt+Shift+R' },
        description: 'Toggle hot reload',
      },
      'toggle-theme': {
        suggested_key: { default: 'Alt+Shift+T' },
        description: 'Toggle light / dark theme',
      },
      'toggle-raw': {
        description: 'Toggle raw / preview',
      },
    },
  },
  vite: () => ({
    build: {
      // mermaid is large; raise the chunk-size warning threshold
      chunkSizeWarningLimit: 5000,
    },
  }),
  hooks: {
    'build:done': (wxt) => {
      const outDir = wxt.config.outDir
      let touched = 0
      let fixed = 0
      walkJs(outDir, (file) => {
        const src = readFileSync(file, 'utf8')
        if (!NONCHAR.test(src)) return
        NONCHAR.lastIndex = 0
        const next = escapeNonchars(src)
        const before = (src.match(NONCHAR) ?? []).length
        writeFileSync(file, next, 'utf8')
        touched++
        fixed += before
      })
      if (touched > 0) {
        wxt.logger.info(
          `Escaped ${fixed} Unicode noncharacter(s) in ${touched} file(s) for Chrome content-script compatibility.`,
        )
      }
    },
  },
})
