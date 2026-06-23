<script lang="ts">
  import type { PanelKind } from '../lib/storage'
  import { t, type Lang } from '../lib/i18n'

  type Props = {
    panel: PanelKind
    lang: Lang
    onSelect: (next: PanelKind) => void
  }
  let { panel, lang, onSelect }: Props = $props()

  const items: Array<{ key: PanelKind; icon: string; i18nKey: string }> = [
    { key: 'folder',   icon: '\u{1F4C1}', i18nKey: 'panel.folder' },
    { key: 'outline',  icon: '☰',           i18nKey: 'panel.outline' },
    { key: 'search',   icon: '\u{1F50D}', i18nKey: 'panel.search' },
    { key: 'settings', icon: '⚙',           i18nKey: 'panel.settings' },
  ]

  function click(key: PanelKind) {
    onSelect(panel === key ? null : key)
  }
</script>

<div class="md-toolbar" role="toolbar" aria-label="Markdown Reader">
  {#each items as item (item.key)}
    <button
      type="button"
      class:is-active={panel === item.key}
      title={t(lang, item.i18nKey)}
      aria-label={t(lang, item.i18nKey)}
      onclick={() => click(item.key)}
    >
      {item.icon}
    </button>
  {/each}
</div>
