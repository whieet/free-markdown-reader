<script lang="ts">
  import { onMount } from 'svelte'
  import { send } from '../lib/messaging'
  import type { ListDirEntry, ListDirResult } from '../lib/messaging'
  import { isMarkdown } from '../config/matches'
  import { t, type Lang } from '../lib/i18n'

  type Props = { lang: Lang }
  let { lang }: Props = $props()

  let entries = $state<ListDirEntry[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let fileAccess = $state<boolean | null>(null)
  let isFile = $state(location.protocol === 'file:')
  let currentUrl = location.href

  async function load() {
    loading = true
    error = null
    if (!isFile) {
      loading = false
      return
    }
    // Route file-access check through SW - it doesn't work from content scripts
    fileAccess = await send<boolean>({ type: 'checkFileAccess' })
    if (!fileAccess) {
      loading = false
      return
    }
    const res = await send<ListDirResult>({ type: 'listDir', url: currentUrl })
    if (!res?.ok) {
      error = res?.error ?? 'Failed to list directory'
      entries = []
    } else {
      entries = res.entries
        .filter((e) => e.isDir || isMarkdown(e.name))
        .sort((a, b) =>
          a.isDir === b.isDir
            ? a.name.localeCompare(b.name)
            : a.isDir
              ? -1
              : 1,
        )
    }
    loading = false
  }

  function isCurrent(entry: ListDirEntry): boolean {
    return entry.url === currentUrl
  }

  onMount(load)
</script>

<h2>{t(lang, 'panel.folder')}</h2>

{#if !isFile}
  <div class="md-warning">{t(lang, 'folder.notFile')}</div>
{:else if fileAccess === false}
  <div class="md-warning">{t(lang, 'folder.needFileAccess')}</div>
{:else if loading}
  <div class="md-warning">{t(lang, 'folder.loading')}</div>
{:else if error}
  <div class="md-warning">{error}</div>
{:else if entries.length === 0}
  <div class="md-warning">{t(lang, 'folder.empty')}</div>
{:else}
  <ul class="md-folder">
    {#each entries as e (e.url)}
      <li class:is-current={isCurrent(e)}>
        <a href={e.url}>
          <span class="icon">{e.isDir ? '📁' : 'M'}</span>
          <span>{e.name}</span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
