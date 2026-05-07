# Svelte + Tailwind Rewrite — Design

**Status:** approved (brainstorm) → pending implementation plan
**Date:** 2026-05-06

## Goal

Rewrite the personal homepage (`https://never.pet`) as a static site built from a single, structured tile configuration file. Keep the same overall vibe (avatar + tiles laid out by section, teal header / green footer, tile-with-icon visual language). Preserve all served URLs. Move deployment from Vercel to GitHub Pages.

## Non-goals

- **Pixel-level visual fidelity.** Same vibe is the bar, not byte-for-byte CSS reproduction. Spacing, exact colors, shadow radii, and font sizes may shift as a natural consequence of moving from hand-tuned SCSS to Tailwind tokens. That's fine.
- Visual redesign, dark mode, or layout rework. The output keeps the existing structure (header section with avatar + greeting + tiles, identities grid, footer).
- Editing tile **contents** to be current (that's a follow-up by the maintainer after rewrite lands).
- Replacing FontAwesome with a different icon set.
- Internationalization framework. The schema permits multilingual inline parts; no i18n routing.
- Restoring or reimplementing the `/_lambda/sao` server endpoint.

## Stack

- **SvelteKit** with `@sveltejs/adapter-static`. All routes prerendered. `csr = false` so the deployed page ships zero framework runtime JS.
- **Tailwind CSS** for styling. Replaces SCSS.
- **TypeScript** throughout.
- **YAML** for the tile source-of-truth.
- **Zod** for build-time schema validation of the YAML.
- **GitHub Actions → GitHub Pages** for deploy. Replaces Vercel.

Rationale: SvelteKit + `adapter-static` produces a fully static output, integrates Vite's build tooling cleanly, and the user is comfortable with Svelte. Tailwind keeps styling colocated and removes the SCSS toolchain. Zero runtime JS keeps the deployed surface area minimal.

## Tile data model

The whole site's tile content lives in a single file: `src/lib/tiles.yaml`. Section membership and ordering are encoded structurally (which array a tile is in, and its position in that array). No `id`, `section`, or `order` fields per tile.

Three shapes cover every tile in the existing site:

1. **Simple label** — an icon + optional title + optional content, optionally a link.
2. **Group** — a parent caption with an array of child labels (Education, Devices, Consoles, etc.).
3. **Rich content** — content composed of an array of inline parts: text, icons, links, strikethrough (e.g. "Lang & Runtime: § docker | php java js python etc. ~~fullstack~~").

These three are unified into one schema: a tile is a label that may also have a `caption` and/or an `items` array. Content is a string or an array of inline parts.

### Schema (Zod)

`src/lib/schema.ts`:

```ts
import { z } from "zod";

const InlinePart = z.union([
  z.string(),
  z.object({
    text:   z.string().optional(),
    icon:   z.string().optional(),     // "fab:docker", "fas:plug", etc.
    link:   z.string().url().optional(),
    strike: z.boolean().optional(),
  }),
]);

const Label = z.object({
  icon:    z.string().optional(),
  icons:   z.array(z.string()).optional(),  // multi-icon leader (e.g. Ingress: bicycle + paper-plane)
  title:   z.string().optional(),
  content: z.union([z.string(), z.array(InlinePart)]).optional(),
  href:    z.string().url().optional(),
  alt:     z.string().optional(),
});

const Tile = Label.extend({
  caption: z.string().optional(),    // floating caption above the tile (was attr=alt in original)
  items:   z.array(Label).optional(),
});

export const TilesDoc = z.object({
  sections: z.object({
    header:     z.array(Tile),
    identities: z.array(Tile),
  }),
});

export type Tile = z.infer<typeof Tile>;
export type Label = z.infer<typeof Label>;
export type InlinePart = z.infer<typeof InlinePart>;
```

Icon names use a `family:name` form (`fas:`, `far:`, `fab:`) that maps directly to FontAwesome's `fas fa-name` / `far fa-name` / `fab fa-name` classes.

### Example tiles

```yaml
sections:
  header:
    - caption: Please visit
      icon: fas:user-circle
      title: Please visit
      content: https://xinhao.lu
      href: https://xinhao.lu

    - caption: Education
      items:
        - icon: fas:university
          title: "Undergraduate, Class of 2021"
          content: "Rensselaer Polytechnic Institute"
          href: https://rpi.edu
        - icon: fas:university
          title: "Master, Class of 2023"
          content: "University of California, San Diego"
          href: https://ucsd.edu

    - caption: Lang & Runtime
      icon: fas:plug
      content:
        - "§ "
        - { icon: fab:docker }
        - " | "
        - { icon: fab:php }
        - { icon: fab:java }
        - { icon: fab:js-square }
        - { icon: fab:python }
        - " etc. "
        - { text: fullstack, strike: true }

  identities:
    - icon: fab:github
      title: GitHub
      content: "@NeverBehave"
      href: https://github.com/NeverBehave
```

## Components

All under `src/lib/components/`:

- **`Tile.svelte`** — renders a single tile. Branches on the presence of `items`: with items, renders a group (caption + child labels); without, renders a single label. Reads optional `caption` and renders it as a real `<span class="caption">` above the tile (replacing the original CSS `::before { content: attr(alt) }` trick).
- **`Label.svelte`** — renders a leaf label: leading icon(s), title, content, wrapped in `<a href>` if `href` is present, else a `<div>`.
- **`InlineContent.svelte`** — renders the `content` field. If it's a string, output it verbatim. If it's `InlinePart[]`, walk the array and render each part: plain string → text node; object → text/icon/link/strike combination.
- **`Icon.svelte`** — `<i class="fas fa-name">` style wrapper. Takes a `family:name` token and emits the right FontAwesome classes.
- **`Section.svelte`** — wraps a group of tiles with the section's class (`.header`, `.identities`) and grid container.

`src/routes/+page.svelte` composes Header, Identities, and Footer sections from the loaded tiles.

## Layout & styling

- **Tailwind config** (`tailwind.config.ts`) extends the theme with the existing visual tokens:
  - Colors: `header: '#006080'`, `copyright: '#004d1a'`, `hosting: '#00802b'`, plus the chem-element accent `#faa3a3` and label backgrounds.
  - Font stack: `Helvetica Neue, Helvetica, Arial, PingFangTC-Light, "Microsoft YaHei", 微软雅黑, "STHeiti Light", STXihei, "华文细黑", Heiti, 黑体, sans-serif`.
  - Box-shadow tokens: tile shadow, section shadow, label shadow.
  - Border-radius: section radius (`2em`).
- **Layout grid** — replace `unsemantic` (`.grid-30/.grid-70/.grid-container`) with Tailwind's `grid` + `col-span-*`. The grid is shallow (header is 30/70 split; identities is a row of 30%-wide tiles), so a small set of utility classes covers it.
- **`src/app.css`** — single global stylesheet:
  - `@tailwind base; @tailwind components; @tailwind utilities;`
  - FontAwesome CSS bundle (imported once; sources stay vendored under `static/assets/webfonts/` for the font files, and the FA CSS is imported from `node_modules` if available or kept vendored — implementation plan to decide).
  - The chem-element exception: ~10 lines of CSS for `.chem-element[element=sodium]::before { content: '10' }` and the hover transform. Pseudo-element + attribute selector is awkward in pure Tailwind; a small custom block is the right exception.
  - Background images: `html { background: url('/assets/images/nat-pants.png') }` and `#container { background: url('/assets/images/nat-pants-ng.png') }`. Kept as plain CSS, not Tailwind utilities.

## Data loading

`src/lib/tiles.ts`:

```ts
import tilesYaml from "./tiles.yaml";
import { TilesDoc } from "./schema";

export const tiles = TilesDoc.parse(tilesYaml);
```

YAML import is wired through `vite-plugin-yaml` (or `@rollup/plugin-yaml` registered in `vite.config.ts`). Build fails with a Zod error if the YAML drifts from the schema.

`src/routes/+page.ts`:

```ts
import { tiles } from "$lib/tiles";
export const prerender = true;
export const csr = false;
export const load = () => ({ tiles });
```

`src/routes/+layout.ts` likewise sets `prerender = true; csr = false;` so the build emits prerendered HTML and the deployed page ships no framework JS.

## Project layout

```
.
├── src/
│   ├── lib/
│   │   ├── tiles.yaml            # the single source of truth
│   │   ├── tiles.ts              # parsed + validated
│   │   ├── schema.ts             # Zod schema
│   │   └── components/
│   │       ├── Tile.svelte
│   │       ├── Label.svelte
│   │       ├── InlineContent.svelte
│   │       ├── Icon.svelte
│   │       └── Section.svelte
│   ├── routes/
│   │   ├── +layout.ts
│   │   ├── +layout.svelte        # head/meta tags
│   │   ├── +page.ts
│   │   └── +page.svelte
│   └── app.css
├── LICENSE                       # repo file, not served
├── static/                       # served verbatim at site root
│   ├── assets/
│   │   ├── images/               # current.png, settings.png, nat-pants*.png
│   │   └── webfonts/             # FontAwesome font files (if vendored)
│   ├── data/
│   │   └── sao.json              # placeholder strings for the footer
│   ├── id_rsa.pub
│   └── keybase.txt
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.cjs
├── tsconfig.json
├── package.json
├── README.md                     # updated
└── .github/
    └── workflows/
        └── deploy.yml
```

`static/` in SvelteKit is the equivalent of the old project root: files placed there are copied verbatim into `build/` at the same paths. So `https://never.pet/assets/images/current.png`, `/keybase.txt`, `/id_rsa.pub`, `/LICENSE` all keep working.

## Footer "yiyan / sao" placeholder

The original homepage's footer fetched a random string from `/_lambda/sao`. Reimplementation:

1. Ship `static/data/sao.json` with a small array of strings (curated copy from the original gist, or a few placeholder strings).
2. Inline a tiny `<script>` block in `+layout.svelte` that fetches `/data/sao.json` on load, picks a random entry, and replaces a `<span id="hitokoto">` placeholder.

Total client JS: ~10 lines. No framework runtime is shipped (Svelte hydration is disabled by `csr = false`); this hand-written script is the only JS the deployed page runs.

The year stamp in the copyright line is resolved at build time, not via `new Date().getFullYear()` in the browser.

The `gtag` Google Analytics snippet is inlined into the page head as in the original (or removed — owner decision; the spec preserves it for visual/behavioral parity).

## CI / deploy

`.github/workflows/deploy.yml`:

- Triggers: push to `master`, manual `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- Concurrency group: `pages`, cancel-in-progress for the deploy job only.
- Steps:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with yarn cache
  3. `yarn install --frozen-lockfile`
  4. `yarn build`
  5. `actions/upload-pages-artifact@v3` with `path: build/`
  6. `actions/deploy-pages@v4`

`svelte.config.js` configures `adapter-static({ pages: 'build', assets: 'build', fallback: undefined })`. `paths.base` is left empty (the site is served at `never.pet` root, not a project path). If a project-page deploy is ever needed, `paths.base` becomes a one-line change.

## Files removed

- `now.json` (Vercel)
- `_redirects` (Vercel/Netlify routing; no-op on GH Pages — removed for cleanliness)
- `api/` and `api/sao.js` (server endpoint)
- `gulpfile.js` (replaced by Vite)
- `yarn.lock` (will be regenerated by `yarn install`)
- `assets/stylesheets/index.bundle.css` and `index.bundle.min.css` (rebuilt by Vite)
- `assets/stylesheets/*.scss` (rewritten as Tailwind config + small `app.css`)
- The root `index.html` (replaced by SvelteKit-rendered `+page.svelte`)
- The root `package.json` (replaced)

`assets/images/`, `assets/webfonts/`, `id_rsa.pub`, `keybase.txt` move into `static/` so their URLs are preserved. `LICENSE` stays at the repo root — it's a repo file, not a served artifact.

## Open implementation choices (defer to plan)

These don't affect the design but the implementation plan will pick:

- Whether to install FontAwesome from npm (`@fortawesome/fontawesome-free`) and import its CSS, or keep the FA CSS+webfonts vendored under `static/`. The latter preserves bytes exactly; the former reduces repo noise.
- Exact YAML loader plugin (`@modyfi/vite-plugin-yaml` vs `@rollup/plugin-yaml` vs hand-rolled). Either is fine.
- Whether the placeholder `sao.json` ships with curated strings copied from the original gist or with a small set of generic strings. Owner can populate later.

## Risks

- **Visual drift**: SCSS → Tailwind translation will produce small spacing/sizing/color differences. This is accepted — same vibe is the bar, not pixel parity. No iteration loop against the current site is required; broad-strokes consistency (sectioning, color palette, tile shape, icon usage) is sufficient.
- **YAML authoring friction**: the inline-parts shape (especially `{ icon: fab:docker }`) is more verbose than raw HTML. This is the cost of structured data; it pays back in validation and consistency. Acceptable.
- **`base` path on GH Pages**: if the user's GH Pages URL turns out to be a project page rather than the apex `never.pet`, `paths.base` needs to be set in `svelte.config.js`. Easy to change.
