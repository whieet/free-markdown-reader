<script lang="ts">
  import {
    MD_PLUGIN_KEYS,
    type MdPluginKey,
    type Settings,
    type ThemeMode,
  } from '../lib/storage'
  import { t, SUPPORTED_LANGS, LANG_LABELS, type Lang } from '../lib/i18n'

  type Props = {
    settings: Settings
    onPatch: (patch: Partial<Settings>) => void
  }
  let { settings, onPatch }: Props = $props()

  function setTheme(theme: ThemeMode) {
    onPatch({ theme })
  }
  function setLang(language: Lang) {
    onPatch({ language })
  }
  function togglePlugin(k: MdPluginKey, value: boolean) {
    onPatch({ mdPlugins: { ...settings.mdPlugins, [k]: value } })
  }

  const THEME_KEYS: ThemeMode[] = ['auto', 'light', 'dark']
</script>

<div class="md-settings">
  <label class="md-row">
    <input
      type="checkbox"
      checked={settings.enable}
      onchange={(e) => onPatch({ enable: e.currentTarget.checked })}
    />
    <span>{t(settings.language, 'settings.enable')}</span>
  </label>
  <label class="md-row">
    <input
      type="checkbox"
      checked={settings.centered}
      onchange={(e) => onPatch({ centered: e.currentTarget.checked })}
    />
    <span>{t(settings.language, 'settings.centered')}</span>
  </label>
  <label class="md-row">
    <input
      type="checkbox"
      checked={settings.refresh}
      onchange={(e) => onPatch({ refresh: e.currentTarget.checked })}
    />
    <span>{t(settings.language, 'settings.refresh')}</span>
  </label>

  <div class="md-section">
    <div class="md-section-title">{t(settings.language, 'settings.theme')}</div>
    <div class="md-seg">
      {#each THEME_KEYS as key (key)}
        <button
          type="button"
          class:is-active={settings.theme === key}
          onclick={() => setTheme(key)}
        >{t(settings.language, `settings.theme.${key}`)}</button>
      {/each}
    </div>
  </div>

  <div class="md-section">
    <div class="md-section-title">{t(settings.language, 'settings.language')}</div>
    <div class="md-seg">
      {#each SUPPORTED_LANGS as l (l)}
        <button
          type="button"
          class:is-active={settings.language === l}
          onclick={() => setLang(l)}
        >{LANG_LABELS[l]}</button>
      {/each}
    </div>
  </div>

  <div class="md-section">
    <div class="md-section-title">{t(settings.language, 'settings.plugins')}</div>
    <div class="md-list">
      {#each MD_PLUGIN_KEYS as k (k)}
        <label class="md-row">
          <input
            type="checkbox"
            checked={settings.mdPlugins[k]}
            onchange={(e) => togglePlugin(k, e.currentTarget.checked)}
          />
          <span>{t(settings.language, `plugin.${k}`)}</span>
        </label>
      {/each}
    </div>
  </div>
</div>
