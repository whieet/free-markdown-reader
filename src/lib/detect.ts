// Detect whether the current document is a markdown file rendered as plain
// text by the browser, and harvest its raw source.

const CONTENT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
])

/** True if the current document looks like raw markdown served as text/plain. */
export function isPlainTextMarkdown(): boolean {
  return CONTENT_TYPES.has(document.contentType)
}

/** Return the `<pre>` element Chrome uses to display the raw file. */
export function getRawContainer(): HTMLPreElement | null {
  return document.body?.querySelector('pre') ?? null
}

/** Read the raw text content of the markdown document, or null if missing. */
export function readRaw(): string | null {
  const pre = getRawContainer()
  return pre?.textContent ?? null
}
