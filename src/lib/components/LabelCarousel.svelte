<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  $: panels = [label, ...(label.history ?? [])] as [Label, ...LabelBase[]];

  const cid = `c${Math.random().toString(36).slice(2, 9)}`;

  let scrollEl: HTMLDivElement;
  let activeIndex = 0;

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }

  function dotLabel(p: LabelBase, i: number): string {
    if (i === 0) return p.year !== undefined ? `Now (${p.year})` : 'Now';
    return p.year !== undefined ? String(p.year) : `Earlier ${i}`;
  }

  function scrollToPanel(i: number) {
    if (!scrollEl) return;
    const panel = scrollEl.children[i] as HTMLElement | undefined;
    if (!panel) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollEl.scrollTo({ left: panel.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    activeIndex = i;
  }
</script>

<div class="label-carousel inline-flex flex-col">
  <div class="panels flex overflow-x-auto snap-x snap-mandatory" bind:this={scrollEl}>
    {#each panels as p, i}
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        role="tabpanel"
        id={`${cid}-panel-${i}`}
        class="panel snap-start flex-[0_0_100%] relative inline-flex items-baseline gap-1 pl-3 pr-8 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
      >
        {#if p.year !== undefined}
          <span class="year-badge absolute top-1 right-2 text-xs font-mono text-tile-history">
            {p.year}
          </span>
        {/if}
        {#if p.icons}
          {#each p.icons as icon}
            <Icon name={icon} />
          {/each}
        {:else if p.icon}
          <Icon name={p.icon} />
        {/if}
        {#if p.title !== undefined}
          <span class="title font-medium">
            <InlineContent value={p.title} />
          </span>
        {/if}
        {#if p.content !== undefined}
          <span class="content text-tile-content">
            <InlineContent value={p.content} />
          </span>
        {/if}
      </svelte:element>
    {/each}
  </div>

  {#if panels.length > 1}
    <div class="dots flex gap-1 mt-1 px-1" role="tablist">
      {#each panels as p, i}
        <button
          type="button"
          role="tab"
          aria-controls={`${cid}-panel-${i}`}
          aria-selected={activeIndex === i}
          aria-label={dotLabel(p, i)}
          class="dot w-2 h-2 rounded-full transition-colors"
          class:bg-tile-content={activeIndex === i}
          class:bg-tile-history={activeIndex !== i}
          on:click={() => scrollToPanel(i)}
        ></button>
      {/each}
    </div>
  {/if}
</div>
