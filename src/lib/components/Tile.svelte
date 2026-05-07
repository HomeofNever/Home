<script lang="ts">
  import Label from './Label.svelte';
  import type { Tile } from '$lib/schema';

  export let tile: Tile;

  $: hasItems = !!tile.items && tile.items.length > 0;
</script>

<div class="tile relative inline-block m-2 mt-7">
  {#if tile.caption}
    <span class="tile-caption absolute -top-5 left-0 text-xs">
      {tile.caption}
    </span>
  {/if}
  {#if hasItems}
    <div class="tile-group inline-flex flex-wrap gap-1">
      {#each tile.items ?? [] as item}
        <Label label={item} />
      {/each}
    </div>
  {:else}
    <Label label={tile} />
  {/if}
</div>
