<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  // The current state (panel 0) plus the history entries (panels 1..N).
  $: panels = [label, ...(label.history ?? [])] as [Label, ...LabelBase[]];

  // Unique prefix per carousel instance so ARIA aria-controls IDs
  // don't collide when multiple carousels render on the same page.
  const cid = `c${Math.random().toString(36).slice(2, 9)}`;

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }
</script>

<div class="label-carousel inline-flex flex-col">
  <div class="panels flex overflow-x-auto snap-x snap-mandatory">
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
</div>
