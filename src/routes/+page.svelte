<script lang="ts">
  import Section from '$lib/components/Section.svelte';

  export let data;
</script>

<div class="section section-header bg-site-header text-white shadow-section py-6">
  <div class="grid grid-cols-12 gap-4 px-6">
    <div class="col-span-12 md:col-span-3 p-4">
      <a href="https://twitter.com/_NeverBehave_/status/1162786240371937280">
        <img class="block w-full bg-white rounded-full p-[3%] shadow-tile" src="/assets/images/current.png" alt="avatar" />
      </a>
    </div>
    <div class="col-span-12 md:col-span-9 px-2">
      <h1 class="text-3xl font-light leading-tight m-0 mb-2">
        Hey, it's
        <span class="inline-block whitespace-nowrap">
          <a class="chem-element" data-element="sodium" href="https://www.wikiwand.com/en/Neon">Ne</a>verBehave
        </span>
      </h1>
      <h1 class="text-3xl font-light leading-tight m-0 mb-6">
        <small class="text-base">好耶，</small>
        <span class="inline-block whitespace-nowrap">
          是咕咕喵[咕喵]
          <span class="inline-block">(&lt;ゝω·) ~☆</span>
        </span>
      </h1>

      <Section tiles={data.tiles.sections.header} variant="header" />
    </div>
  </div>
</div>

<Section tiles={data.tiles.sections.identities} variant="identities" />
