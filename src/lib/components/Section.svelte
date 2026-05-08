<script lang="ts">
  import Tile from './Tile.svelte';
  import type { Tile as TileType } from '$lib/schema';

  export let tiles: TileType[];
  export let variant: 'header' | 'identities';
</script>

<div class="section section-{variant}" class:section-header={variant === 'header'} class:section-identities={variant === 'identities'}>
  <div class="flex flex-wrap items-start py-4" class:px-6={variant === 'identities'}>
    {#each tiles as tile}
      <Tile {tile} />
    {/each}
  </div>
</div>
