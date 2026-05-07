<script lang="ts">
  import Tile from './Tile.svelte';
  import type { Tile as TileType } from '$lib/schema';

  export let tiles: TileType[];
  export let variant: 'header' | 'identities';
</script>

<div class="section section-{variant}" class:section-header={variant === 'header'} class:section-identities={variant === 'identities'}>
  <div class="flex flex-wrap items-start px-6 py-4">
    {#each tiles as tile}
      <Tile {tile} />
    {/each}
  </div>
</div>
