<script lang="ts">
  export let name: string;

  $: parts = name.split(':');
  $: family = parts[0] ?? 'fas';
  $: slug = parts[1] ?? '';
</script>

<i aria-hidden="true" class="{family} fa-{slug}"></i>
