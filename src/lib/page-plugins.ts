// Wire up runtime affordances after the markdown HTML is in the DOM:
// per-code-block copy buttons and an image lightbox.

export function wirePagePlugins(root: HTMLElement) {
  wireCopyButtons(root)
  wireImageLightbox(root)
}

function wireCopyButtons(root: HTMLElement) {
  root.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement | null
    if (!target?.classList.contains('md-copy')) return
    const data = target.getAttribute('data-copy') ?? ''
    const text = decodeURIComponent(data)
    void navigator.clipboard.writeText(text).then(() => {
      const prev = target.textContent
      target.textContent = 'Copied!'
      target.classList.add('is-copied')
      setTimeout(() => {
        target.textContent = prev
        target.classList.remove('is-copied')
      }, 1200)
    })
  })
}

function wireImageLightbox(root: HTMLElement) {
  root.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement | null
    if (!t || t.tagName !== 'IMG') return
    const img = t as HTMLImageElement
    if (img.closest('a')) return
    openLightbox(img.src, img.alt)
  })
}

function openLightbox(src: string, alt: string) {
  const overlay = document.createElement('div')
  overlay.className = 'md-lightbox'
  overlay.innerHTML = `<img alt="${escapeHtml(alt)}" src="${escapeHtml(src)}" />`
  overlay.addEventListener('click', () => overlay.remove())
  document.body.append(overlay)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
