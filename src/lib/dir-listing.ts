// Parse Chrome's generated file:// directory-listing HTML.
//
// Chrome serves a directory as an HTML document that registers each entry
// via an inline `<script>addRow("name", "url-encoded", isDir, size, date)`
// call. Because DOMParser does NOT execute scripts, querying for <a> tags
// returns nothing in modern Chrome — we have to regex `addRow` invocations
// out of the response text. Older paths used <a class="icon file"> anchors;
// we try that as a fallback. This format is an undocumented Chromium
// internal, so the parser is intentionally defensive and degrades to an
// empty list on any failure.

import type { ListDirEntry, ListDirResult } from './messaging'

const ADD_ROW = /addRow\s*\(\s*(.+?)\s*\)\s*;/g

export async function listDirectory(
  baseUrl: string,
): Promise<ListDirResult> {
  // baseUrl is a file URL pointing at a file; strip to its parent directory.
  let dirUrl: string
  try {
    const u = new URL(baseUrl)
    if (u.protocol !== 'file:') {
      return { ok: false, entries: [], error: 'not-file-scheme' }
    }
    const path = u.pathname.replace(/[^/]*$/, '')
    dirUrl = `file://${path}`
  } catch (err) {
    return { ok: false, entries: [], error: String(err) }
  }

  let html: string
  try {
    const res = await fetch(dirUrl)
    html = await res.text()
  } catch (err) {
    return { ok: false, entries: [], error: String(err) }
  }

  const entries = parseListing(html, dirUrl)
  return { ok: true, entries }
}

export function parseListing(html: string, dirUrl: string): ListDirEntry[] {
  // Try the `addRow(...)` script form first (modern Chrome).
  const fromScript = parseAddRow(html, dirUrl)
  if (fromScript.length > 0) return fromScript

  // Fallback: parse <a class="icon …"> anchors (older variants).
  return parseAnchors(html, dirUrl)
}

function parseAddRow(html: string, dirUrl: string): ListDirEntry[] {
  const out: ListDirEntry[] = []
  for (const m of html.matchAll(ADD_ROW)) {
    const args = safeJsonArrayFromArgs(m[1] ?? '')
    if (!args || args.length < 3) continue
    const name = String(args[0] ?? '')
    const encoded = String(args[1] ?? '')
    const isDir = Boolean(args[2])
    if (!name || name === '.' || name === '..') continue
    out.push({
      name,
      url: dirUrl + encoded,
      isDir,
    })
  }
  return out
}

function parseAnchors(html: string, dirUrl: string): ListDirEntry[] {
  // Very small subset of DOM parsing — we only need href + class + text.
  const out: ListDirEntry[] = []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href')
    if (!href || href.startsWith('?') || href === '..' || href === '../') return
    const name = a.textContent?.trim() ?? href
    const isDir = href.endsWith('/')
    out.push({
      name,
      url: new URL(href, dirUrl).href,
      isDir,
    })
  })
  return out
}

/**
 * Turn the comma-separated arg list of an `addRow(...)` call into a real JS
 * array. The args are JS string literals + numbers + booleans, so we can wrap
 * them in `[ … ]` and try JSON.parse first; if that fails we fall back to a
 * tolerant hand-parser that handles JS-string-escaped names with embedded
 * quotes / unicode escapes — critical for CJK and spaces.
 */
function safeJsonArrayFromArgs(argList: string): unknown[] | null {
  // Quick path: replace `'…'` with `"…"` and try JSON.parse on `[…]`.
  const tryJson = (s: string) => {
    try {
      return JSON.parse(`[${s}]`) as unknown[]
    } catch {
      return null
    }
  }
  const direct = tryJson(argList)
  if (direct) return direct

  const swapped = argList.replace(/'((?:[^'\\]|\\.)*)'/g, (_, body) => {
    return JSON.stringify(unescapeJsString(body))
  })
  return tryJson(swapped)
}

function unescapeJsString(s: string): string {
  return s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, esc) => {
    if (esc.startsWith('u')) return String.fromCharCode(parseInt(esc.slice(1), 16))
    if (esc.startsWith('x')) return String.fromCharCode(parseInt(esc.slice(1), 16))
    switch (esc) {
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      case '0':
        return '\0'
      default:
        return esc
    }
  })
}
