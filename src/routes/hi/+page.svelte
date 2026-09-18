<script lang="ts">
  import MobileProfile from '$lib/components/MobileProfile.svelte';
  import '../../profile.css';

  export let data;
</script>

<svelte:head>
  <title>NeverBehave - Glad our paths crossed</title>
  <meta name="description" content="Glad our paths crossed :3" />
  <meta property="og:title" content="NeverBehave" />
  <meta property="og:url" content="https://never.pet/hi/" />
  <meta property="og:description" content="Glad our paths crossed :3" />
  <meta property="og:image" content="https://never.pet/assets/images/current.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="NeverBehave" />
  <meta name="twitter:description" content="Glad our paths crossed :3" />
  <meta name="twitter:image" content="https://never.pet/assets/images/current.png" />
</svelte:head>

<MobileProfile links={data.mobileLinks} />
