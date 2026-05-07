<script lang="ts">
  import Icon from './Icon.svelte';
  import type { InlinePart } from '$lib/schema';

  export let value: string | InlinePart[] | undefined = undefined;

  $: parts = value === undefined ? [] : typeof value === 'string' ? [value] : value;
</script>

{#each parts as part}
  {#if typeof part === 'string'}
    {part}
  {:else}
    {#if part.icon}
      <Icon name={part.icon} />
    {/if}
    {#if part.text !== undefined}
      {#if part.link}
        <a href={part.link}>
          {#if part.strike}<del>{part.text}</del>{:else}{part.text}{/if}
        </a>
      {:else if part.strike}
        <del>{part.text}</del>
      {:else}
        {part.text}
      {/if}
    {/if}
  {/if}
{/each}
