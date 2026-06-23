// Typed messaging contract between content scripts and the service worker.
// Kept intentionally small: one shape per action.

import { browser } from 'wxt/browser'

export type Message =
  | { type: 'fetch'; url: string }
  | { type: 'listDir'; url: string }
  | { type: 'checkFileAccess' }
  | { type: 'getSettings' }
  | { type: 'patchSettings'; patch: Record<string, unknown> }
  | { type: 'pushCommand'; command: BroadcastCommand }

export type BroadcastCommand =
  | 'toggle-panel'
  | 'toggle-centered'
  | 'toggle-refresh'
  | 'toggle-theme'
  | 'toggle-raw'

export interface ListDirEntry {
  name: string
  url: string
  isDir: boolean
}

export interface ListDirResult {
  ok: boolean
  entries: ListDirEntry[]
  error?: string
}

export async function send<T = unknown>(msg: Message): Promise<T> {
  return (await browser.runtime.sendMessage(msg)) as T
}
