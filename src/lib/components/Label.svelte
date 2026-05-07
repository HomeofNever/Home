<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label } from '$lib/schema';

  export let label: Label;

  $: tag = label.href ? 'a' : 'div';
</script>

<svelte:element
  this={tag}
  {...(label.href ? { href: label.href } : {})}
  aria-label={label.alt}
  class="label inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
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
</svelte:element>
