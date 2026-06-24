// In-document text search: find matches inside the rendered article and
// expose next/prev navigation by wrapping matches in <mark class="md-hit">.

const HIT_CLASS = 'md-hit'
const ACTIVE_CLASS = 'md-hit-active'

export interface SearchHandle {
  count: number
  current: number
  next(): void
  prev(): void
  goto(index: number): void
  clear(): void
}

export function search(root: HTMLElement, query: string, andScroll = true): SearchHandle {
  clearMarks(root)
  const q = query.trim()
  if (!q) return makeHandle([], false)

  const re = new RegExp(escapeRegex(q), 'gi')
  const hits: HTMLElement[] = []

  // Walk text nodes and wrap matches. Skip text inside our own <mark> and
  // inside script/style/code (still highlight visible code text).
  // Walk elements + text so whole subtrees we must not touch are pruned in one
  // shot (FILTER_REJECT skips descendants): scripts/styles, and SVG / KaTeX where
  // inserting an HTML <mark> corrupts the render. This avoids a per-text-node
  // ancestor walk on math-heavy documents.
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element
          if (
            el instanceof SVGElement ||
            el.tagName === 'SCRIPT' ||
            el.tagName === 'STYLE' ||
            el.classList.contains('katex') ||
            el.classList.contains('md-mermaid')
          ) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_SKIP
        }
        const p = (node as Text).parentElement
        if (!p || p.classList.contains(HIT_CLASS)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    },
  )

  const work: Text[] = []
  for (let n: Node | null = walker.nextNode(); n; n = walker.nextNode()) {
    work.push(n as Text)
  }

  for (const textNode of work) {
    const text = textNode.nodeValue ?? ''
    if (!text || !re.test(text)) {
      re.lastIndex = 0
      continue
    }
    re.lastIndex = 0
    const frag = document.createDocumentFragment()
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      const start = m.index
      const end = start + m[0].length
      if (start > last) frag.append(text.slice(last, start))
      const mark = document.createElement('mark')
      mark.className = HIT_CLASS
      mark.textContent = m[0]
      frag.append(mark)
      hits.push(mark)
      last = end
      if (m[0].length === 0) re.lastIndex++
    }
    if (last < text.length) frag.append(text.slice(last))
    textNode.parentNode?.replaceChild(frag, textNode)
  }

  return makeHandle(hits, andScroll)
}

function makeHandle(hits: HTMLElement[], andScroll: boolean): SearchHandle {
  // -1 means no hit has been activated yet, so the first next()/prev() lands on
  // the first/last hit instead of skipping it.
  let current = -1
  if (andScroll && hits.length > 0) {
    current = 0
    activate(hits, 0)
  }
  const goto = (i: number) => {
    if (hits.length === 0) return
    const wrapped = ((i % hits.length) + hits.length) % hits.length
    activate(hits, wrapped)
    current = wrapped
  }
  return {
    get count() {
      return hits.length
    },
    get current() {
      return current
    },
    next: () => goto(current < 0 ? 0 : current + 1),
    prev: () => goto(current < 0 ? hits.length - 1 : current - 1),
    goto,
    clear: () => {
      // Drop highlights from the live DOM.
      for (const h of hits) {
        const parent = h.parentNode
        if (parent) parent.replaceChild(document.createTextNode(h.textContent ?? ''), h)
      }
    },
  }
}

function activate(hits: HTMLElement[], idx: number) {
  for (const h of hits) h.classList.remove(ACTIVE_CLASS)
  const target = hits[idx]
  if (!target) return
  target.classList.add(ACTIVE_CLASS)
  target.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function clearMarks(root: HTMLElement) {
  root.querySelectorAll(`mark.${HIT_CLASS}`).forEach((el) => {
    const t = document.createTextNode(el.textContent ?? '')
    el.parentNode?.replaceChild(t, el)
  })
  root.normalize()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
