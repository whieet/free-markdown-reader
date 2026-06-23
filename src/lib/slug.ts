// Heading slug helpers — GitHub-style slugs with a per-document collision
// counter so duplicate headings still get unique anchors.

const NON_WORD = /[^\p{L}\p{N}]+/gu

/** GitHub-style slug: lowercase, non-word → '-', trimmed. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(NON_WORD, '-')
    .replace(/^-+|-+$/g, '')
}

/** Per-document slugger that disambiguates collisions with a -1, -2 suffix. */
export function createSlugger(): (text: string) => string {
  const counts = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text) || 'section'
    const seen = counts.get(base) ?? 0
    counts.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${seen}`
  }
}
