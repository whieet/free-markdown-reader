// Settings stored in chrome.storage.local.

import { browser } from 'wxt/browser'
import { storage } from 'wxt/utils/storage'
import { detectLanguage, type Lang } from './i18n'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type PanelKind = 'folder' | 'outline' | 'search' | 'settings' | null

/** All toggleable markdown-it plugins. Keys match render.ts. */
export const MD_PLUGIN_KEYS = [
  'emoji',
  'sub',
  'sup',
  'ins',
  'mark',
  'abbr',
  'deflist',
  'footnote',
  'taskLists',
  'tableOfContents',
  'container',
  'alert',
  'katex',
  'mermaid',
] as const
export type MdPluginKey = (typeof MD_PLUGIN_KEYS)[number]

export interface Settings {
  enable: boolean
  centered: boolean
  refresh: boolean
  theme: ThemeMode
  language: Lang
  panel: PanelKind
  mdPlugins: Record<MdPluginKey, boolean>
}

// Cache detected language so first load is instant
const detected = detectLanguage()

export const DEFAULT_SETTINGS: Settings = {
  enable: true,
  centered: true,
  refresh: false,
  theme: 'auto',
  language: detected,
  panel: 'outline',
  mdPlugins: Object.fromEntries(
    MD_PLUGIN_KEYS.map((k) => [k, true]),
  ) as Record<MdPluginKey, boolean>,
}

const STORAGE_KEY = 'local:settings'

const settingsItem = storage.defineItem<Settings>(STORAGE_KEY, {
  fallback: DEFAULT_SETTINGS,
})

export async function getSettings(): Promise<Settings> {
  const raw = await settingsItem.getValue()
  return mergeDefaults(raw)
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = {
    ...current,
    ...patch,
    mdPlugins: { ...current.mdPlugins, ...(patch.mdPlugins ?? {}) },
  }
  await settingsItem.setValue(next)
  return next
}

export function onSettingsChanged(
  cb: (next: Settings, prev: Settings) => void,
): () => void {
  return settingsItem.watch((next, prev) => {
    cb(mergeDefaults(next), mergeDefaults(prev))
  })
}

function mergeDefaults(raw: Settings | null): Settings {
  if (!raw) return DEFAULT_SETTINGS
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    mdPlugins: { ...DEFAULT_SETTINGS.mdPlugins, ...(raw.mdPlugins ?? {}) },
  }
}

/** Whether the extension is permitted to access file:// URLs. */
export function isFileAccessAllowed(): Promise<boolean> {
  return new Promise((resolve) => {
    // Chrome only.
    const ext = browser.extension as typeof browser.extension & {
      isAllowedFileSchemeAccess?: (cb: (ok: boolean) => void) => void
    }
    if (typeof ext.isAllowedFileSchemeAccess === 'function') {
      ext.isAllowedFileSchemeAccess((ok) => resolve(!!ok))
    } else {
      resolve(false)
    }
  })
}
