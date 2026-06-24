// Content script entrypoint. Detects markdown pages, takes over the
// document, and mounts the Svelte app.

import { mount } from 'svelte'
import App from './App.svelte'
import { isPlainTextMarkdown, readRaw } from '../../lib/detect'
import { getSettings } from '../../lib/storage'
import { MD_MATCHES } from '../../config/matches'
import katexCss from 'katex/dist/katex.min.css?inline'
import hljsCss from 'highlight.js/styles/github-dark.min.css?inline'
import contentCss from '../../styles/content.css?inline'

export default defineContentScript({
  matches: MD_MATCHES,
  cssInjectionMode: 'manual',
  runAt: 'document_start',
  async main(_ctx) {
    // Hide body immediately to prevent plaintext flash.
    // We unhide if this isn't a markdown file, or after rendering completes.
    document.documentElement.style.setProperty('visibility', 'hidden', 'important')

    // Wait for DOM to be ready so we can check contentType and read raw.
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        const onReady = () => {
          document.removeEventListener('DOMContentLoaded', onReady)
          resolve()
        }
        document.addEventListener('DOMContentLoaded', onReady)
      })
    }

    if (!isPlainTextMarkdown()) {
      document.documentElement.style.removeProperty('visibility')
      return
    }

    const raw = readRaw()
    if (raw == null) {
      document.documentElement.style.removeProperty('visibility')
      return
    }

    const settings = await getSettings()
    if (!settings.enable) {
      document.documentElement.style.removeProperty('visibility')
      return
    }

    injectStyles()
    try {
      takeover()

      const host = document.createElement('div')
      host.id = 'mdr-root'
      document.body.append(host)

      mount(App, {
        target: host,
        props: { initialRaw: raw, initialSettings: settings },
      })
    } catch (err) {
      // Rendering failed — undo the takeover so the browser's original plaintext
      // shows again instead of a blank page (mdr-active hides the native <pre>).
      document.body.classList.remove('mdr-active')
      document.getElementById('mdr-root')?.remove()
      console.error('[Markdown Reader] failed to render; showing raw text:', err)
    } finally {
      // Always lift the anti-flash hide so a failure can never leave a blank page.
      document.documentElement.style.removeProperty('visibility')
    }
  },
})

function takeover() {
  document.body.classList.add('mdr-active')
  document.documentElement.dataset.mdrTheme ??= 'auto'
  document.body.style.margin = '0'
  const path = location.pathname
  const seg = path.slice(path.lastIndexOf('/') + 1)
  let name = seg
  try {
    name = decodeURIComponent(seg)
  } catch {
    // Malformed / non-UTF-8 percent-encoding (e.g. `100%.md`, GBK CJK names) —
    // decodeURIComponent throws URIError; keep the raw segment instead.
  }
  if (name && !document.title) document.title = name
  setFavicon()
}

// Inject our SVG favicon only on file:// — http(s) pages may serve a strict
// CSP (e.g. raw.githubusercontent.com sends `default-src 'none'; … sandbox`)
// that blocks `data:` images and logs a noisy console violation. The favicon
// is a fallback for file:// where Chrome shows no icon at all; on the web the
// page's own favicon (or Chrome's default) is good enough. We can't reliably
// probe the policy first because that very `fetch` is itself subject to the
// same CSP (connect-src falls back to default-src).
function setFavicon() {
  if (location.protocol !== 'file:') return
  if (document.querySelector('link[rel~="icon"]')) return
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="%230969da"/><text x="8" y="12" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="700" fill="white">M</text></svg>',
    )
  document.head.append(link)
}

function injectStyles() {
  const style = document.createElement('style')
  style.id = 'mdr-styles'
  style.textContent = `${contentCss}\n${katexCss}\n${hljsCss}`
  document.head.append(style)
}
