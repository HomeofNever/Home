<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  $: panels = [label, ...(label.history ?? [])] as [Label, ...LabelBase[]];
  $: historyCount = label.history?.length ?? 0;
  $: autoWrapperTooltip = label.deprecated
    ? 'Deprecated'
    : historyCount > 0
      ? `Scroll for ${historyCount} older variant${historyCount === 1 ? '' : 's'}`
      : null;
  $: wrapperTooltip = label.tooltip ?? autoWrapperTooltip;

  function panelAutoTooltip(p: LabelBase): string | null {
    return p.deprecated && !label.deprecated ? 'Deprecated' : null;
  }

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }
</script>

<div
  class="label-carousel relative inline-grid max-w-[min(40rem,100%)] bg-tile-bg shadow-tile rounded-md overflow-hidden"
  class:order-last={label.deprecated}
  class:opacity-60={label.deprecated}
  data-tooltip={wrapperTooltip}
>
  {#each panels as p}
    <div
      class="col-start-1 row-start-1 invisible pointer-events-none px-3 py-2 leading-snug sm:whitespace-nowrap"
      aria-hidden="true"
    >
      {#if p.icons}{#each p.icons as icon}<Icon name={icon} />{/each}{:else if p.icon}<Icon name={p.icon} />{/if}
      {#if p.title !== undefined}<span class="font-medium"> <InlineContent value={p.title} /></span>{/if}
      {#if p.content !== undefined}<span class="text-tile-content"> <InlineContent value={p.content} /></span>{/if}
      {#if p.system !== undefined}<span class="ml-1 inline-block text-xs text-tile-history bg-tile-history/15 rounded px-1.5 align-middle"><InlineContent value={p.system} /></span>{/if}
      {#if p.year !== undefined}<span class="text-tile-history"> · {p.year}</span>{/if}
    </div>
  {/each}

  <div class="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory">
    {#each panels as p}
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        class="snap-start snap-always shrink-0 w-full px-3 py-2 text-tile-title font-light leading-snug no-underline"
        class:opacity-60={p.deprecated && !label.deprecated}
        data-tooltip={p.tooltip ?? panelAutoTooltip(p)}
      >
        {#if p.icons}{#each p.icons as icon}<Icon name={icon} />{/each}{:else if p.icon}<Icon name={p.icon} />{/if}
        {#if p.title !== undefined}<span class="title font-medium"> <InlineContent value={p.title} /></span>{/if}
        {#if p.content !== undefined}<span class="content text-tile-content"> <InlineContent value={p.content} /></span>{/if}
        {#if p.system !== undefined}<span class="system ml-1 inline-block text-xs text-tile-history bg-tile-history/15 rounded px-1.5 align-middle"><InlineContent value={p.system} /></span>{/if}
        {#if p.year !== undefined}<span class="text-tile-history"> · {p.year}</span>{/if}
      </svelte:element>
    {/each}
  </div>
</div>
