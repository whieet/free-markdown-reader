<script lang="ts">
  import { search, type SearchHandle } from '../lib/search'
  import { t, type Lang } from '../lib/i18n'

  type Props = { contentRoot: HTMLElement | null; lang: Lang }
  let { contentRoot, lang }: Props = $props()

  let q = $state('')
  let handle = $state<SearchHandle | null>(null)
  let count = $state(0)
  let current = $state(0)

  function run(andScroll = false) {
    if (!contentRoot) return
    // Preserve scroll position so removing the active <mark> doesn't make
    // the browser's scroll-anchor heuristic jump us to the top.
    const savedScroll = window.scrollY
    handle?.clear()
    if (!q) {
      handle = null
      count = 0
      current = 0
      return
    }
    handle = search(contentRoot, q, andScroll)
    count = handle.count
    current = handle.count > 0 ? 1 : 0
    if (handle.count === 0 || !andScroll) {
      window.scrollTo({ top: savedScroll })
    }
  }

  function next() {
    handle?.next()
    if (handle) current = handle.current + 1
  }
  function prev() {
    handle?.prev()
    if (handle) current = handle.current + 1
  }

  function onKey(ev: KeyboardEvent) {
    if (ev.key === 'Enter') {
      if (handle && handle.count > 0) {
        next()
      } else {
        run(true)
      }
    } else if (ev.key === 'Escape') {
      q = ''
      run()
    }
  }
</script>

<h2>{t(lang, 'panel.search')}</h2>
<div class="md-search">
  <input
    type="search"
    bind:value={q}
    oninput={() => run(false)}
    onkeydown={onKey}
    placeholder={t(lang, 'search.placeholder')}
    autocomplete="off"
  />
  {#if q}
    <div class="md-search-status">
      <span>{count > 0 ? `${current} / ${count}` : t(lang, 'search.noMatches')}</span>
      <span class="md-search-nav">
        <button type="button" onclick={prev} disabled={count === 0}>‹</button>
        <button type="button" onclick={next} disabled={count === 0}>›</button>
      </span>
    </div>
  {/if}
</div>
