<script lang="ts">
  import InlineLeaf from './InlineLeaf.svelte';
  import type { InlinePart } from '$lib/schema';

  export let value: string | InlinePart[] | undefined = undefined;

  $: parts = value === undefined ? [] : typeof value === 'string' ? [value] : value;

  function isGroup(p: InlinePart): p is Extract<InlinePart, { items: unknown }> {
    return typeof p === 'object' && p !== null && 'items' in p;
  }
</script>

{#each parts as part}{#if typeof part === 'string'}{part}{:else if isGroup(part)}{#if part.strike}<del><svelte:self value={part.items} /></del>{:else}<svelte:self value={part.items} />{/if}{:else}<InlineLeaf icon={part.icon} text={part.text} href={part.href} tooltip={part.tooltip} strike={part.strike ?? false} />{/if}{/each}
