<script lang="ts">
  import { base } from '$app/paths';
  import '../app.css';

  const buildYear = new Date().getFullYear();
</script>

<svelte:head>
  <meta property="og:title" content="About NeverBehave" />
  <meta property="og:url" content="https://never.pet" />
  <meta property="og:description" content="欸，是咕咕喵" />
  <meta property="og:image" content="{base}/assets/images/current.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="About NeverBehave" />
  <meta name="twitter:site" content="@_NeverBehave_" />
  <meta name="twitter:description" content="欸，是咕咕喵" />
  <meta name="twitter:image" content="{base}/assets/images/current.png" />
  <title>About NeverBehave</title>
</svelte:head>

<div id="container" class="font-sans">
  <slot />

  <div class="section section-footer shadow-section">
    <a class="hosting block bg-site-hosting text-gray-200 px-4 py-3 text-sm no-underline" href="https://github.com/HomeofNever/Home">
      <i aria-hidden="true" class="fas fa-code-branch mr-2"></i>A fork of atomicneko
    </a>
  </div>

  <div class="section section-footer shadow-section">
    <a class="hosting block bg-site-hosting text-gray-200 px-4 py-3 text-sm no-underline" href="https://gist.github.com/NeverBehave/606d7e14436187b4d45e8657fafd40ab">
      <i aria-hidden="true" class="far fa-heart mr-2"></i>
      /sao@NeverBehave: <span id="hitokoto">…</span>
    </a>
    <div class="copyright bg-site-copyright text-gray-400 text-sm px-4 py-2">
      <i class="fas fa-exclamation-triangle mr-2"></i>
      Copyright © 2015-{buildYear} NeverBehave.
    </div>
  </div>
</div>
