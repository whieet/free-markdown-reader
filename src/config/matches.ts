// Markdown file URL patterns.
//
// We keep this small and focused because Chrome evaluates patterns
// serially; a large array slows content-script injection, which
// increases the plain-text flash on navigation.
//
// Coverage: .md .markdown .mkd .mdx — lower + upper, http(s), file://
//
// Note: Chrome doesn't support `{md,markdown}` style alternation in
// `matches` patterns — each variant needs its own string.

const PLAIN_EXTS = ['md', 'mkd', 'mdx'] as const // these cover >99% of files

function httpVariants(ext: string): string[] {
  const up = ext.toUpperCase()
  return [
    `*://*/*.${ext}`,
    `*://*/*.${ext}?*`,
    `*://*/*.${up}`,
    `*://*/*.${up}?*`,
  ]
}

function fileVariants(ext: string): string[] {
  const up = ext.toUpperCase()
  return [
    `file://*.${ext}`,
    `file://*.${ext}?*`,
    `file://*.${up}`,
    `file://*.${up}?*`,
  ]
}

export const MD_MATCHES: string[] = [
  ...PLAIN_EXTS.flatMap(httpVariants),
  ...PLAIN_EXTS.flatMap(fileVariants),
  // .markdown is common enough to include separately
  ...httpVariants('markdown'),
  ...fileVariants('markdown'),
]

/** True if a filename ends with a supported markdown extension. */
export function isMarkdown(name: string): boolean {
  const lower = name.toLowerCase()
  return ['.md', '.markdown', '.mkd', '.mdx'].some((e) => lower.endsWith(e))
}
