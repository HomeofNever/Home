<script lang="ts">
  import LabelCarousel from './LabelCarousel.svelte';
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label } from '$lib/schema';

  export let label: Label;

  $: hasHistory = !!label.history && label.history.length > 0;
  $: tag = label.href ? 'a' : 'div';
</script>

{#if hasHistory}
  <LabelCarousel {label} />
{:else}
  <svelte:element
    this={tag}
    {...(label.href ? { href: label.href } : {})}
    aria-label={label.alt}
    class="label inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
    class:order-last={label.deprecated}
    class:opacity-60={label.deprecated}
    data-tooltip={label.tooltip ?? (label.deprecated ? 'Deprecated' : null)}
  >
    {#if label.icons}
      {#each label.icons as icon}
        <Icon name={icon} />
      {/each}
    {:else if label.icon}
      <Icon name={label.icon} />
    {/if}
    {#if label.title !== undefined}
      <span class="title font-medium">
        <InlineContent value={label.title} />
      </span>
    {/if}
    {#if label.content !== undefined}
      <span class="content text-tile-content">
        <InlineContent value={label.content} />
      </span>
    {/if}
    {#if label.system !== undefined}
      <span class="system inline-block text-xs text-tile-history bg-tile-history/15 rounded px-1.5 align-middle">
        <InlineContent value={label.system} />
      </span>
    {/if}
  </svelte:element>
{/if}
