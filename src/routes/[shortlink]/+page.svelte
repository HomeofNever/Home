<script lang="ts">
  export let data;
</script>

<svelte:head>
  <title>Redirecting to {data.title}</title>
  <meta name="robots" content="noindex" />
  <meta name="shortlink-target" content={data.href} />
  <meta http-equiv="refresh" content={`0;url=${data.href}`} />
  <link rel="canonical" href={data.href} />
</svelte:head>

<main class="min-h-[50vh] bg-site-header px-6 py-16 text-center text-white">
  <p class="m-0 text-lg font-light">
    Redirecting to
    <a class="font-medium text-white underline" href={data.href}>{data.title}</a>…
  </p>
</main>
