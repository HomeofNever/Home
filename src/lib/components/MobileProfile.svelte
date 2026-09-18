<script lang="ts">
  import { base } from '$app/paths';
  import Icon from '$lib/components/Icon.svelte';
  import type { MobileProfileLink } from '$lib/mobile-links';

  export let links: MobileProfileLink[];

  $: primaryLinks = links.filter((link) => link.tier === 'primary');
</script>

<main class="site-pattern min-h-screen px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-tile-title">
  <div class="site-pattern-soft mx-auto w-full max-w-[30rem] overflow-hidden rounded-section shadow-section">
    <header class="bg-site-header px-6 pb-6 pt-7 text-center text-white shadow-section">
      <img
        class="mx-auto mb-4 block h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-tile"
        src="{base}/assets/images/current-256.png"
        width="112"
        height="112"
        alt="NeverBehave"
        fetchpriority="high"
      />
      <h1 class="m-0 text-3xl font-medium leading-tight">NeverBehave</h1>
      <p class="mx-auto mb-0 mt-2 max-w-sm text-base leading-snug text-gray-200">Glad our paths crossed :3</p>
    </header>

    <section aria-labelledby="primary-links" class="px-4 pb-7 pt-5">
      <h2 id="primary-links" class="sr-only">Contact and profiles</h2>
      <div class="relative mt-5">
        <span class="tile-caption absolute -top-5 left-0 text-xs text-caption-dark">Keep in touch</span>
        <div class="flex flex-col gap-2">
          {#each primaryLinks as link}
            <a
              class="label flex min-h-16 items-center gap-3 rounded-md bg-tile-bg px-3 py-3 font-light leading-none text-tile-title no-underline shadow-tile transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-site-header focus:ring-offset-2"
              href={link.href}
            >
              {#if link.icon}
                <span class="flex w-5 shrink-0 items-center justify-center text-lg">
                  <Icon name={link.icon} />
                </span>
              {/if}
              <span class="min-w-0">
                <span class="title block text-lg font-medium leading-tight">{link.title}</span>
                {#if link.description}
                  <span class="content mt-1 block text-sm leading-tight text-tile-content">{link.description}</span>
                {/if}
              </span>
            </a>
          {/each}
        </div>
      </div>

      <div class="relative mt-8">
        <span class="tile-caption absolute -top-5 left-0 text-xs text-caption-dark">More about me</span>
        <a
          class="label flex min-h-16 items-center gap-3 rounded-md bg-tile-bg px-3 py-3 font-light leading-none text-tile-title no-underline shadow-tile transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-site-header focus:ring-offset-2"
          href="{base}/"
        >
          <span class="flex w-5 shrink-0 items-center justify-center text-lg">
            <Icon name="fas:user-circle" />
          </span>
          <span class="min-w-0">
            <span class="title block text-lg font-medium leading-tight">Full profile</span>
            <span class="content mt-1 block text-sm leading-tight text-tile-content">All my links, interests, and little details.</span>
          </span>
        </a>
      </div>
    </section>

    <footer class="bg-site-hosting px-4 py-3 text-center text-sm text-gray-200 shadow-section">
      never.pet
    </footer>
  </div>
</main>
