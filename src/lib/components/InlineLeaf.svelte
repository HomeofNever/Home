<script lang="ts">
  import Icon from './Icon.svelte';
  export let icon: string | undefined = undefined;
  export let text: string | undefined = undefined;
  export let href: string | undefined = undefined;
  export let tooltip: string | undefined = undefined;
  export let strike: boolean = false;
</script>

{#if href}<a href={href} data-tooltip={tooltip ?? null}>{#if strike}<del>{#if icon}<Icon name={icon} />{/if}{#if text !== undefined}{text}{/if}</del>{:else}{#if icon}<Icon name={icon} />{/if}{#if text !== undefined}{text}{/if}{/if}</a>{:else if tooltip}<span data-tooltip={tooltip}>{#if strike}<del>{#if icon}<Icon name={icon} />{/if}{#if text !== undefined}{text}{/if}</del>{:else}{#if icon}<Icon name={icon} />{/if}{#if text !== undefined}{text}{/if}{/if}</span>{:else if strike}<del>{#if icon}<Icon name={icon} />{/if}{#if text !== undefined}{text}{/if}</del>{:else}{#if icon}<Icon name={icon} />{/if}{#if text !== undefined}{text}{/if}{/if}
