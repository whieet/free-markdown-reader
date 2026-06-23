<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import Toolbar from '../../panels/Toolbar.svelte'
  import OutlinePanel from '../../panels/OutlinePanel.svelte'
  import FolderPanel from '../../panels/FolderPanel.svelte'
  import SearchPanel from '../../panels/SearchPanel.svelte'
  import SettingsPanel from '../../panels/SettingsPanel.svelte'
  import {
    onSettingsChanged,
    setSettings,
    type PanelKind,
    type Settings,
  } from '../../lib/storage'
  import { createRenderer } from '../../lib/render'
  import { wirePagePlugins } from '../../lib/page-plugins'
  import { renderMermaid } from '../../lib/mermaid'
  import { send, type BroadcastCommand } from '../../lib/messaging'
  import { browser } from 'wxt/browser'

  type Heading = { id: string; level: number; text: string }

  type Props = {
    initialRaw: string
    initialSettings: Settings
  }
  let { initialRaw, initialSettings }: Props = $props()

  let raw = $state.raw(untrack(() => initialRaw))
  let settings = $state.raw(untrack(() => initialSettings))
  let html = $state('')
  let headings = $state<Heading[]>([])
  let contentRoot: HTMLElement | null = $state(null)
  let rawMode = $state(false)

  function effectiveTheme(s: Settings): 'light' | 'dark' {
    if (s.theme === 'light') return 'light'
    if (s.theme === 'dark') return 'dark'
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function rerender() {
    const renderer = createRenderer(settings)
    const { html: out } = renderer.render(raw)
    html = out
    // Defer post-render work until DOM updates.
    queueMicrotask(() => {
      if (!contentRoot) return
      headings = extractHeadings(contentRoot)
      wirePagePlugins(contentRoot)
      if (settings.mdPlugins.mermaid) {
        void renderMermaid(contentRoot, effectiveTheme(settings) === 'dark')
      }
      // Honour deep-link #hash on first render.
      if (location.hash) {
        const id = decodeURIComponent(location.hash.slice(1))
        document.getElementById(id)?.scrollIntoView()
      }
    })
  }

  function extractHeadings(root: HTMLElement): Heading[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'),
    ).map((el) => ({
      id: el.id,
      level: Number(el.tagName.slice(1)),
      text: el.textContent ?? '',
    }))
  }

  $effect(() => {
    if (settings.enable) rerender()
  })

  $effect(() => {
    document.documentElement.dataset.mdrTheme = settings.theme
  })

  // ====== Hot reload (poll the SW which fetches the URL) ======
  let pollTimer: number | null = null
  $effect(() => {
    if (pollTimer != null) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    if (!settings.refresh) return
    const tick = async () => {
      try {
        const next = await send<string | undefined>({ type: 'fetch', url: location.href })
        if (typeof next === 'string' && next !== raw) {
          raw = next
          const pre = document.body.querySelector('pre')
          if (pre) pre.textContent = next
        }
      } catch {
        // ignore — tab may have gone background
      }
      pollTimer = window.setTimeout(tick, 500)
    }
    pollTimer = window.setTimeout(tick, 500)
    return () => {
      if (pollTimer != null) clearTimeout(pollTimer)
    }
  })

  // ====== React to settings changes from popup ======
  onMount(() => {
    const off = onSettingsChanged((next) => (settings = next))
    const onCmd = (msg: unknown) => {
      const m = msg as { type?: string; command?: BroadcastCommand } | null
      if (!m || m.type !== 'pushCommand' || !m.command) return
      applyCommand(m.command)
    }
    browser.runtime.onMessage.addListener(onCmd)
    return () => {
      off()
      browser.runtime.onMessage.removeListener(onCmd)
    }
  })

  function applyCommand(cmd: BroadcastCommand) {
    switch (cmd) {
      case 'toggle-panel':
        patchSettings({ panel: settings.panel ? null : 'outline' })
        break
      case 'toggle-centered':
        patchSettings({ centered: !settings.centered })
        break
      case 'toggle-refresh':
        patchSettings({ refresh: !settings.refresh })
        break
      case 'toggle-theme': {
        const t = effectiveTheme(settings) === 'dark' ? 'light' : 'dark'
        patchSettings({ theme: t })
        break
      }
      case 'toggle-raw':
        rawMode = !rawMode
        document.body.dataset.mdrRaw = rawMode ? '1' : ''
        break
    }
  }

  function patchSettings(p: Partial<Settings>) {
    void setSettings(p)
  }
</script>

<div
  class="md-app"
  data-panel={settings.panel ?? 'none'}
  data-centered={settings.centered ? '1' : '0'}
>
  <aside class="md-side">
    {#if settings.panel}
      <Toolbar panel={settings.panel} lang={settings.language} onSelect={(p: PanelKind) => patchSettings({ panel: p })} />
      <div class="md-panel">
        {#if settings.panel === 'folder'}
          <FolderPanel lang={settings.language} />
        {:else if settings.panel === 'outline'}
          <OutlinePanel {headings} lang={settings.language} contentRoot={contentRoot} />
        {:else if settings.panel === 'search'}
          <SearchPanel contentRoot={contentRoot} lang={settings.language} />
        {:else if settings.panel === 'settings'}
          <SettingsPanel {settings} onPatch={patchSettings} />
        {/if}
      </div>
    {:else}
      <button
        class="md-expand"
        title={settings.language === 'zh_CN' ? '打开侧栏' : 'Open panel'}
        aria-label={settings.language === 'zh_CN' ? '打开侧栏' : 'Open panel'}
        onclick={() => patchSettings({ panel: 'outline' })}
      >☰</button>
    {/if}
  </aside>

  <main class="md-main">
    <article
      class="md-content markdown-body"
      bind:this={contentRoot}
    >{@html html}</article>
  </main>
</div>
