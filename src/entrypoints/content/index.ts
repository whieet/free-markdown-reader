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
    takeover()

    const host = document.createElement('div')
    host.id = 'mdr-root'
    document.body.append(host)

    mount(App, {
      target: host,
      props: { initialRaw: raw, initialSettings: settings },
    })

    document.documentElement.style.removeProperty('visibility')
  },
})

function takeover() {
  document.body.classList.add('mdr-active')
  document.documentElement.dataset.mdrTheme ??= 'auto'
  document.body.style.margin = '0'
  const path = location.pathname
  const name = decodeURIComponent(path.slice(path.lastIndexOf('/') + 1))
  if (name && !document.title) document.title = name
  void setFavicon()
}

const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="%230969da"/><text x="8" y="12" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="700" fill="white">M</text></svg>'

async function setFavicon() {
  if (document.querySelector('link[rel~="icon"]')) return
  // A strict page CSP blocks our data: favicon and logs a console violation
  // (e.g. raw.githubusercontent.com serves `default-src 'none'`). file:// pages
  // have no CSP; for http(s) we check the document's policy before injecting so
  // we never trip a violation on a page that would block it.
  if (location.protocol !== 'file:' && (await cspBlocksDataImages())) return
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG)
  document.head.append(link)
}

/**
 * Best-effort: would this document's Content-Security-Policy block a `data:`
 * image? A content-script fetch bypasses the page CSP, so reading the CSP header
 * from the (cache-served) response never triggers a violation itself. Returns
 * false when unknown, so the favicon still loads on ordinary pages.
 */
async function cspBlocksDataImages(): Promise<boolean> {
  let csp: string | null = null
  try {
    const res = await fetch(location.href, { method: 'GET', cache: 'force-cache' })
    csp = res.headers.get('content-security-policy')
  } catch {
    return false
  }
  if (!csp) return false
  // Multiple comma-joined policies all apply; the favicon is blocked if ANY of
  // them would block a data: image.
  return csp.split(',').some(policyBlocksDataImages)
}

function policyBlocksDataImages(policy: string): boolean {
  const directive =
    cspDirective(policy, 'img-src') ?? cspDirective(policy, 'default-src')
  if (!directive) return false // this policy doesn't constrain images
  // Only an explicit `data:` source admits a data: image — `*` and host sources
  // do not match the data: scheme.
  return !directive.includes('data:')
}

/** Lowercased source list (directive name dropped) for a CSP directive, or null. */
function cspDirective(policy: string, name: string): string[] | null {
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean)
    if (tokens[0]?.toLowerCase() === name) {
      return tokens.slice(1).map((t) => t.toLowerCase())
    }
  }
  return null
}

function injectStyles() {
  const style = document.createElement('style')
  style.id = 'mdr-styles'
  style.textContent = `${contentCss}\n${katexCss}\n${hljsCss}`
  document.head.append(style)
}
