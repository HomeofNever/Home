# never.pet — personal homepage

A static personal homepage. Built with [SvelteKit](https://kit.svelte.dev/) and styled with [Tailwind CSS](https://tailwindcss.com/). All tile content lives in a single YAML file so it's easy to edit.

## Edit the content

Tiles are defined in [`src/lib/tiles.yaml`](src/lib/tiles.yaml). The schema is in [`src/lib/schema.ts`](src/lib/schema.ts) and is enforced at build time — a malformed tile fails the build.

Three tile shapes:

- **Simple label** — an icon + optional title + optional content, optionally a link.
- **Group** — a parent caption with a list of `items` (each item is a label).
- **Rich content** — a tile whose `content` (or `title`) is an array of inline parts: text, icons, links, strikethrough.

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

## License

MIT.