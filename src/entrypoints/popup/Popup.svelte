<script lang="ts">
  import { onMount } from 'svelte'
  import {
    DEFAULT_SETTINGS,
    MD_PLUGIN_KEYS,
    getSettings,
    setSettings,
    onSettingsChanged,
    type MdPluginKey,
    type Settings,
    type ThemeMode,
  } from '../../lib/storage'
  import { send } from '../../lib/messaging'
  import { t, SUPPORTED_LANGS, LANG_LABELS, type Lang } from '../../lib/i18n'

  let settings = $state<Settings>(DEFAULT_SETTINGS)
  let fileAccess = $state<boolean | null>(null)

  onMount(() => {
    let off: (() => void) | null = null
    void (async () => {
      settings = await getSettings()
      // checkFileAccess is also available from the popup (extension page).
      // We still proxy through the SW for consistency.
      try {
        fileAccess = await send<boolean>({ type: 'checkFileAccess' })
      } catch {
        fileAccess = null
      }
      off = onSettingsChanged((next) => (settings = next))
    })()
    return () => { off?.() }
  })

  async function patch(p: Partial<Settings>) {
    settings = await setSettings(p)
  }
</script>

<div class="pop">
  <h1>
    <span>Markdown Reader</span>
    <span style="font-size: 11px; color: var(--pop-muted);">v1.0</span>
  </h1>

  {#if fileAccess === false}
    <div class="warn">
      {t(settings.language, 'settings.fileAccessWarning')}
    </div>
  {/if}

  <label>
    <input
      type="checkbox"
      checked={settings.enable}
      onchange={(e) => patch({ enable: e.currentTarget.checked })}
    />
    {t(settings.language, 'settings.enable')}
  </label>
  <label>
    <input
      type="checkbox"
      checked={settings.centered}
      onchange={(e) => patch({ centered: e.currentTarget.checked })}
    />
    {t(settings.language, 'settings.centered')}
  </label>
  <label>
    <input
      type="checkbox"
      checked={settings.refresh}
      onchange={(e) => patch({ refresh: e.currentTarget.checked })}
    />
    {t(settings.language, 'settings.refresh')}
  </label>

  <h2>{t(settings.language, 'settings.theme')}</h2>
  <div class="seg">
    {#each ['auto', 'light', 'dark'] as themeKey (themeKey)}
      <button
        type="button"
        class:is-active={settings.theme === themeKey}
        onclick={() => patch({ theme: themeKey as ThemeMode })}
      >{t(settings.language, `settings.theme.${themeKey}`)}</button>
    {/each}
  </div>

  <h2>{t(settings.language, 'settings.language')}</h2>
  <div class="seg">
    {#each SUPPORTED_LANGS as l (l)}
      <button
        type="button"
        class:is-active={settings.language === l}
        onclick={() => patch({ language: l })}
      >{LANG_LABELS[l]}</button>
    {/each}
  </div>

  <h2>{t(settings.language, 'settings.plugins')}</h2>
  <div class="grid">
    {#each MD_PLUGIN_KEYS as k (k)}
      <label>
        <input
          type="checkbox"
          checked={settings.mdPlugins[k]}
          onchange={(e) =>
            patch({ mdPlugins: { ...settings.mdPlugins, [k]: e.currentTarget.checked } })}
        />
        {t(settings.language, `plugin.${k}`)}
      </label>
    {/each}
  </div>

  <h2>{t(settings.language, 'settings.shortcuts')}</h2>
  <div style="font-size: 12px; display: grid; gap: 2px;">
    <div><kbd>Alt+Shift+B</kbd> {t(settings.language, 'settings.shortcut.togglePanel')}</div>
    <div><kbd>Alt+Shift+C</kbd> {t(settings.language, 'settings.shortcut.toggleCentered')}</div>
    <div><kbd>Alt+Shift+R</kbd> {t(settings.language, 'settings.shortcut.toggleRefresh')}</div>
    <div><kbd>Alt+Shift+T</kbd> {t(settings.language, 'settings.shortcut.toggleTheme')}</div>
  </div>
</div>
