// Runtime mermaid renderer. We render at content-script time (not at
// markdown-parse time) so we can resolve to SVG, defer the heavy import
// behind a dynamic chunk, and re-render on theme change.

interface Bag {
  initialized: boolean
  theme: 'light' | 'dark'
}

const state: Bag = { initialized: false, theme: 'light' }

export async function renderMermaid(root: HTMLElement, dark: boolean) {
  const blocks = root.querySelectorAll<HTMLElement>(
    'pre.md-code code.language-mermaid, pre code.language-mermaid',
  )
  if (blocks.length === 0) return

  const { default: mermaid } = await import('mermaid')
  const wantTheme = dark ? 'dark' : 'default'
  if (!state.initialized || (dark ? 'dark' : 'light') !== state.theme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: wantTheme,
      securityLevel: 'strict',
    })
    state.initialized = true
    state.theme = dark ? 'dark' : 'light'
  }

  let counter = 0
  for (const code of Array.from(blocks)) {
    const pre = code.closest('pre')
    if (!pre || pre.dataset.mermaidDone === '1') continue
    const src = code.textContent ?? ''
    try {
      const id = `mmd-${Date.now()}-${counter++}`
      const { svg } = await mermaid.render(id, src)
      const host = document.createElement('div')
      host.className = 'md-mermaid'
      host.innerHTML = svg
      pre.replaceWith(host)
    } catch (err) {
      pre.dataset.mermaidDone = '1'
      pre.classList.add('md-mermaid-error')
      const note = document.createElement('div')
      note.className = 'md-mermaid-note'
      note.textContent = `Mermaid: ${(err as Error).message}`
      pre.append(note)
    }
  }
}
