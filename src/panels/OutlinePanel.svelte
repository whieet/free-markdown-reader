<script lang="ts">
  import { onMount } from 'svelte'
  import { createScrollSpy } from '../lib/scroll-spy'
  import { t, type Lang } from '../lib/i18n'

  type Heading = { id: string; level: number; text: string }

  type Props = {
    headings: Heading[]
    lang: Lang
    /** Container element holding the rendered headings, for scroll-spy. */
    contentRoot?: HTMLElement | null
  }
  let { headings, lang, contentRoot = null }: Props = $props()

  let activeId = $state<string | null>(null)

  $effect(() => {
    if (!contentRoot || headings.length === 0) return
    const els = headings
      .map((h) => contentRoot!.querySelector<HTMLElement>(`#${cssEscape(h.id)}`))
      .filter((el): el is HTMLElement => !!el)
    const teardown = createScrollSpy(els, {
      onChange: (id) => (activeId = id),
    })
    return teardown
  })

  function cssEscape(s: string): string {
    // For our slugs we only need to escape leading digits and # / .
    return s.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1')
  }

  function jump(ev: MouseEvent, id: string) {
    ev.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }
</script>

<h2>{t(lang, 'panel.outline')}</h2>
{#if headings.length === 0}
  <div class="md-warning">{t(lang, 'outline.empty')}</div>
{:else}
  <ul class="md-outline">
    {#each headings as h (h.id)}
      <li data-level={h.level} class:is-active={activeId === h.id}>
        <a href={`#${h.id}`} onclick={(e) => jump(e, h.id)}>{h.text}</a>
      </li>
    {/each}
  </ul>
{/if}
