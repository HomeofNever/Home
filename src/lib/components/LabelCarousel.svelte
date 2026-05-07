<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  $: panels = [label, ...(label.history ?? [])] as [Label, ...LabelBase[]];

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }
</script>

<div class="label-carousel inline-block w-72 bg-tile-bg shadow-tile rounded-md overflow-hidden">
  <div class="panels flex overflow-x-auto snap-x snap-mandatory">
    {#each panels as p}
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        class="panel snap-start snap-always shrink-0 w-full relative inline-flex items-baseline gap-1 pl-3 pr-8 py-2 text-tile-title font-light leading-none no-underline"
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
