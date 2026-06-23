// Scroll-spy: report which heading id is currently in view.

export interface ScrollSpyOptions {
  container?: HTMLElement | Window
  offset?: number
  onChange: (activeId: string | null) => void
}

export function createScrollSpy(
  headings: HTMLElement[],
  { container = window, offset = 80, onChange }: ScrollSpyOptions,
): () => void {
  let lastActive: string | null = null
  let ticking = false

  function update() {
    ticking = false
    const scrollY =
      container === window
        ? window.scrollY
        : (container as HTMLElement).scrollTop
    let active: string | null = null
    for (const h of headings) {
      const top =
        container === window
          ? h.getBoundingClientRect().top + window.scrollY
          : h.offsetTop
      if (top - offset <= scrollY) active = h.id
      else break
    }
    if (active !== lastActive) {
      lastActive = active
      onChange(active)
    }
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  container.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  // Prime once.
  update()

  return () => {
    container.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
}
