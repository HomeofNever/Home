# never.pet — personal homepage

A static personal homepage. Built with [SvelteKit](https://kit.svelte.dev/) and styled with [Tailwind CSS](https://tailwindcss.com/). All tile content lives in a single YAML file so it's easy to edit.

## Edit the content

Tiles are defined in [`src/lib/tiles.yaml`](src/lib/tiles.yaml). The schema is in [`src/lib/schema.ts`](src/lib/schema.ts) and is enforced at build time — a malformed tile fails the build.

Three tile shapes:

- **Simple label** — an icon + optional title + optional content, optionally a link.
- **Group** — a parent caption with a list of `items` (each item is a label).
- **Rich content** — a tile whose `content` (or `title`) is an array of inline parts: text, icons, links, strikethrough.

## Make it yours

Want this as your own homepage? Fork the repo and edit [`src/lib/tiles.yaml`](src/lib/tiles.yaml) — that one file drives every tile on the page.

1. Replace the `header` and `identities` sections with your own captions, links, and handles.
2. Icons use Font Awesome prefixes: `fas:` (solid), `far:` (regular), `fab:` (brands). Browse names at [fontawesome.com/icons](https://fontawesome.com/icons).
3. Swap the avatar at [`src/lib/assets/`](src/lib/assets/) (or `static/assets/images/current.png`) and update the `<svelte:head>` meta tags in [`src/routes/+layout.svelte`](src/routes/+layout.svelte).
4. Run `yarn test` to validate the YAML against the schema, then `yarn dev` to preview.

Drop a tile by deleting its block; add one by copying a neighbour and tweaking it. Build errors point to the offending line.

### Tracking history

Any tile or item can carry a `history` array of prior states. Use this when there's a real chronology — not for playful "I used to claim X" jokes (those still belong in inline strikethrough). Each history entry has the same shape as a label, plus an optional integer `year`.

```yaml
- icon: fab:linux
  content: Framework 13
  year: 2024
  history:
    - year: 2019
      icon: fab:windows
      content: MSI GS65 (RTX 2060)
```

The current value renders as the first carousel panel; history entries follow in document order (newest-first by convention). Each panel shows a small year badge in its top-right corner if the entry has a `year`. Swipe horizontally on touch or trackpad to see prior panels.

History entries cannot themselves carry `history` (one level deep). Use this for laptops you've replaced, server OSes you've migrated through, anything with a "what came before" worth keeping. Don't use it to encode "I tried X but went with Y" — that's what inline strike is for.

The site is currently statically prerendered with no client-side JavaScript, so the carousel is swipe-only — there's no clickable dot indicator yet. That's a deliberate trade-off; a JS-enhanced layer (clickable year dots, keyboard navigation, active-panel tracking, and a global year-rewind dropdown) can be added later by enabling CSR on the homepage route.

## Develop

```bash
yarn install
yarn dev      # http://localhost:5173
yarn test     # schema validation tests
yarn build    # static site → build/
yarn preview  # serve the built site locally
```

## Deploy

Push to `main`. GitHub Actions builds and deploys to GitHub Pages.

## Static assets

Anything under [`static/`](static/) is served verbatim at the site root. Images and the keybase verification live there.

## History

This branch is a fresh start for the SvelteKit + Tailwind rewrite. The previous incarnation of the site (vanilla HTML / Vercel / Gulp + SCSS, last touched in 2021) is preserved on the [`legacy-2021`](https://github.com/HomeofNever/Home/tree/legacy-2021) branch.

The original layout and tile concept were forked from [amphineko/atomicneko](https://github.com/amphineko/atomicneko); the YAML-driven content model and the SvelteKit rewrite are this repository's additions.

## License

MIT.