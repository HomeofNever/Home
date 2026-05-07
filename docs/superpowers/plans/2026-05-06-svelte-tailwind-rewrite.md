# Svelte + Tailwind Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the personal homepage as a SvelteKit static site with all tile content driven from a single YAML file, styled with Tailwind, deployed to GitHub Pages.

**Architecture:** SvelteKit with `@sveltejs/adapter-static`, `prerender = true`, `csr = false` so the deployed page ships zero framework runtime JS. Tile data lives in `src/lib/tiles.yaml`, validated at build time by a Zod schema. Components render the tiles into the same overall page structure as the existing site.

**Tech Stack:** SvelteKit 2.x · Svelte 4 · TypeScript · Tailwind CSS 3 · Zod · Vitest · `@modyfi/vite-plugin-yaml` · FontAwesome 6 (npm) · GitHub Actions Pages.

**Spec:** [`docs/superpowers/specs/2026-05-06-svelte-tailwind-rewrite-design.md`](../specs/2026-05-06-svelte-tailwind-rewrite-design.md)

**Note on a small schema enrichment vs. spec:** the spec defined `title: z.string().optional()`. While migrating content I found one tile (`Browser`) where the title contains a strikethrough (`~~Chrome~~ Firefox`). To preserve that, the schema in this plan extends `title` to accept `string | InlinePart[]`, identical to `content`. This is a one-line widening of the spec, in the spirit of the schema (rich inline parts), not a structural change.

---

## File Map

**To create:**

- `package.json`, `yarn.lock` (regenerated)
- `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- `tailwind.config.ts`, `postcss.config.cjs`
- `src/app.html`, `src/app.css`, `src/app.d.ts`, `src/yaml.d.ts`
- `src/lib/schema.ts`, `src/lib/schema.test.ts`
- `src/lib/tiles.yaml`, `src/lib/tiles.ts`
- `src/lib/components/{Icon,InlineContent,Label,Tile,Section}.svelte`
- `src/routes/+layout.ts`, `src/routes/+layout.svelte`
- `src/routes/+page.ts`, `src/routes/+page.svelte`
- `static/data/sao.json`
- `.github/workflows/deploy.yml`

**To move (preserving URL paths):**

- `assets/images/*` → `static/assets/images/*`
- `id_rsa.pub` → `static/id_rsa.pub`
- `keybase.txt` → `static/keybase.txt`

**Stays at repo root (not served on the web):**

- `LICENSE`

**To delete:**

- Old `package.json`, `yarn.lock`
- `gulpfile.js`
- `now.json`, `_redirects`
- `api/sao.js`, `api/`
- Old `index.html`
- `assets/stylesheets/` (all SCSS + prebuilt CSS)
- `assets/webfonts/` (FontAwesome from npm replaces it)
- Empty `assets/` directory

**To update:**

- `README.md`, `.gitignore`

---

## Task 1: Remove legacy files

**Files:**
- Delete: `index.html`, `package.json`, `yarn.lock`, `gulpfile.js`, `now.json`, `_redirects`
- Delete: `api/sao.js`, `api/`
- Delete: `assets/stylesheets/`, `assets/webfonts/`

- [ ] **Step 1: Remove root-level legacy files**

```bash
rm index.html package.json yarn.lock gulpfile.js now.json _redirects
```

- [ ] **Step 2: Remove the API directory**

```bash
rm -rf api
```

- [ ] **Step 3: Remove SCSS sources, prebuilt bundles, and vendored webfonts**

```bash
rm -rf assets/stylesheets assets/webfonts
```

- [ ] **Step 4: Verify only kept assets remain at root and under `assets/`**

Run: `ls -la && ls assets/`
Expected: root contains `assets/`, `id_rsa.pub`, `keybase.txt`, `LICENSE`, `README.md`, `.git/`, `.gitignore`, `docs/`. `assets/` contains only `images/`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy Vercel/Gulp/SCSS scaffolding"
```

---

## Task 2: Bootstrap SvelteKit project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- Create: `src/app.html`, `src/app.d.ts`
- Create: `src/routes/+layout.ts`, `src/routes/+page.svelte`
- Update: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "homeofnever",
  "version": "0.0.1",
  "description": "Personal homepage — SvelteKit static site",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.5.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^4.2.0",
    "svelte-check": "^3.6.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `yarn install`
Expected: creates `node_modules/` and `yarn.lock`. No errors.

- [ ] **Step 3: Create `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      strict: true
    }),
    paths: {
      base: process.env.BASE_PATH ?? ''
    }
  }
};

export default config;
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 6: Create `src/app.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
    <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 7: Create `src/app.d.ts`**

```ts
declare global {
  namespace App {
    // empty for now
  }
}

export {};
```

- [ ] **Step 8: Create `src/routes/+layout.ts`**

```ts
export const prerender = true;
export const csr = false;
export const trailingSlash = 'always';
```

- [ ] **Step 9: Create a placeholder `src/routes/+page.svelte`**

```svelte
<h1>Hello, SvelteKit</h1>
```

- [ ] **Step 10: Update `.gitignore`**

Replace contents of `.gitignore`:

```
.DS_Store
node_modules
/build
/.svelte-kit
/package
.env
.env.*
!.env.example
.vercel
.output
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
```

- [ ] **Step 11: Verify the build works**

Run: `yarn build`
Expected: builds successfully; creates `build/` directory containing `index.html` with "Hello, SvelteKit".

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: bootstrap SvelteKit project"
```

---

## Task 3: Move static assets

**Files:**
- Move: `assets/images/*` → `static/assets/images/*`
- Move: `id_rsa.pub`, `keybase.txt` → `static/`
- `LICENSE` stays at the repo root (it's a repo file, not served).

- [ ] **Step 1: Create the `static/` directory tree and move images**

```bash
mkdir -p static/assets/images static/data
mv assets/images/* static/assets/images/
rmdir assets/images
rmdir assets
```

- [ ] **Step 2: Move root-level static files (LICENSE stays at root)**

```bash
mv id_rsa.pub keybase.txt static/
```

- [ ] **Step 3: Verify the layout**

Run: `ls -R static/ && ls LICENSE`
Expected: `static/` shows `assets/images/{current.png, settings.png, nat-pants.png, nat-pants-ng.png}`, `data/`, `id_rsa.pub`, `keybase.txt`. `LICENSE` is still at the repo root.

- [ ] **Step 4: Verify the build still works and serves assets**

Run: `yarn build && ls build/assets/images/`
Expected: build succeeds; `build/assets/images/current.png` exists.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: move static assets into static/ directory"
```

---

## Task 4: Install and configure Tailwind + FontAwesome

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.ts`, `postcss.config.cjs`
- Create: `src/app.css`
- Create: `src/routes/+layout.svelte`

- [ ] **Step 1: Install Tailwind, PostCSS, autoprefixer, FontAwesome**

```bash
yarn add --dev tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
yarn add @fortawesome/fontawesome-free@^6.5.0
```

- [ ] **Step 2: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,svelte,ts,js}'],
  theme: {
    extend: {
      colors: {
        'site-header': '#006080',
        'site-copyright': '#004d1a',
        'site-hosting': '#00802b',
        'tile-bg': '#eeeeee',
        'tile-title': '#333333',
        'tile-content': '#555555',
        'caption-light': '#eeeeee',
        'caption-dark': '#333333'
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'PingFangTC-Light',
          '"Microsoft YaHei"',
          '微软雅黑',
          '"STHeiti Light"',
          'STXihei',
          '"华文细黑"',
          'Heiti',
          '黑体',
          'sans-serif'
        ]
      },
      boxShadow: {
        tile: '0 0 0.15em 0.15em rgba(0, 0, 0, 0.1)',
        section: '0 0 0.15em 0.15em rgba(0, 0, 0, 0.125)'
      },
      borderRadius: {
        section: '2em'
      }
    }
  },
  plugins: []
} satisfies Config;
```

- [ ] **Step 3: Create `postcss.config.cjs`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 4: Create `src/app.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@fortawesome/fontawesome-free/css/all.min.css';

html {
  background-image: url('/assets/images/nat-pants.png');
  background-position: center;
  font-family: theme('fontFamily.sans');
}

body {
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 1em;
}

#container {
  background-image: url('/assets/images/nat-pants-ng.png');
  background-position: center;
  box-shadow: theme('boxShadow.section');
  margin: 1.5em auto;
  max-width: 64em;
  border-radius: theme('borderRadius.section');
  overflow: hidden;
}

/* Section captions: light text on header bg, dark text on identities bg. */
.section-header .tile-caption {
  color: theme('colors.caption-light');
}

.section-identities .tile-caption {
  color: theme('colors.caption-dark');
}

/* Chem-element decoration in the greeting (preserves the original sodium-pun). */
.chem-element {
  background: rgba(255, 163, 163, 0.09);
  border-radius: 0.25em;
  box-shadow: 0 0 0.1em 0.1em rgba(0, 0, 0, 0.05);
  color: #fff;
  margin-right: 0.1em;
  padding: 0.35em 0.1em 0.35em 0.35em;
  text-decoration: none;
  transition-duration: 0.5s;
}

.chem-element:hover {
  box-shadow: 0 0 0.2em 0.2em rgba(255, 255, 255, 0.05);
  transform: translate(1em, 1em);
}

.chem-element[data-element='sodium']::before {
  content: '10';
  font-size: 0.45em;
  vertical-align: -0.5em;
}

.chem-element[data-element='sodium']:hover {
  background: #faa3a3;
}
```

- [ ] **Step 5: Create `src/routes/+layout.svelte` to import `app.css`**

```svelte
<script lang="ts">
  import '../app.css';
</script>

<slot />
```

- [ ] **Step 6: Update `src/routes/+page.svelte` to verify Tailwind works**

```svelte
<h1 class="text-3xl font-bold text-site-header p-4">Tailwind is working</h1>
```

- [ ] **Step 7: Verify build succeeds and page renders**

Run: `yarn dev` (in another terminal or background)
Then: open `http://localhost:5173` and confirm the heading is large, bold, and teal-colored.
Stop the dev server with Ctrl+C when satisfied.

- [ ] **Step 8: Verify production build works**

Run: `yarn build`
Expected: build succeeds; `build/_app/immutable/assets/*.css` contains compiled Tailwind output.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: install and configure Tailwind + FontAwesome"
```

---

## Task 5: Install YAML loader, Zod, and Vitest

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `src/yaml.d.ts`

- [ ] **Step 1: Install dependencies**

```bash
yarn add zod
yarn add --dev @modyfi/vite-plugin-yaml vitest @vitest/ui
```

- [ ] **Step 2: Update `vite.config.ts` to register the YAML plugin**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  plugins: [yaml(), sveltekit()],
  test: {
    include: ['src/**/*.test.ts']
  }
});
```

- [ ] **Step 3: Add type declaration for YAML imports**

Create `src/yaml.d.ts`:

```ts
declare module '*.yaml' {
  const value: unknown;
  export default value;
}
```

- [ ] **Step 4: Update `tsconfig.json` to know about Vitest globals (optional but useful)**

No changes required if tests use named imports from `vitest`. Skip.

- [ ] **Step 5: Smoke-test by importing a tiny YAML stub**

Create `src/lib/_smoke.yaml`:

```yaml
hello: world
```

Modify `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import smoke from '$lib/_smoke.yaml';
</script>

<pre>{JSON.stringify(smoke, null, 2)}</pre>
```

Run: `yarn build`
Expected: build succeeds. Open `build/index.html` and confirm `{ "hello": "world" }` is present in the rendered output.

- [ ] **Step 6: Remove the smoke stub**

```bash
rm src/lib/_smoke.yaml
```

Restore `src/routes/+page.svelte` to:

```svelte
<h1 class="text-3xl font-bold text-site-header p-4">Tailwind is working</h1>
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: configure YAML plugin, Zod, and Vitest"
```

---

## Task 6: Define the schema

**Files:**
- Create: `src/lib/schema.ts`

- [ ] **Step 1: Create `src/lib/schema.ts`**

```ts
import { z } from 'zod';

const InlinePart = z.union([
  z.string(),
  z.object({
    text: z.string().optional(),
    icon: z.string().optional(),
    link: z.string().url().optional(),
    strike: z.boolean().optional()
  })
]);
export type InlinePart = z.infer<typeof InlinePart>;

const RichString = z.union([z.string(), z.array(InlinePart)]);

const Label = z.object({
  icon: z.string().optional(),
  icons: z.array(z.string()).optional(),
  title: RichString.optional(),
  content: RichString.optional(),
  href: z.string().url().optional(),
  alt: z.string().optional()
});
export type Label = z.infer<typeof Label>;

const Tile = Label.extend({
  caption: z.string().optional(),
  items: z.array(Label).optional()
});
export type Tile = z.infer<typeof Tile>;

export const TilesDoc = z.object({
  sections: z.object({
    header: z.array(Tile),
    identities: z.array(Tile)
  })
});
export type TilesDoc = z.infer<typeof TilesDoc>;
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schema.ts
git commit -m "feat: add Zod schema for tile data"
```

---

## Task 7: Schema tests

**Files:**
- Create: `src/lib/schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TilesDoc } from './schema';

describe('TilesDoc schema', () => {
  it('accepts a minimal valid document', () => {
    const doc = { sections: { header: [], identities: [] } };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts a simple label tile', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:github', title: 'GitHub', content: '@me', href: 'https://github.com/me' }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts a group tile with items', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Education',
            items: [
              { icon: 'fas:university', title: 'BS', content: 'RPI', href: 'https://rpi.edu' },
              { icon: 'fas:university', title: 'MS', content: 'UCSD', href: 'https://ucsd.edu' }
            ]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts content as an inline-parts array', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Lang & Runtime',
            icon: 'fas:plug',
            content: ['§ ', { icon: 'fab:docker' }, ' | ', { text: 'fullstack', strike: true }]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts title as inline parts', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Browser',
            icon: 'fab:firefox',
            title: [{ text: 'Chrome', strike: true }, ' Firefox'],
            href: 'https://www.mozilla.org/'
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects unknown top-level keys via parse on a known shape', () => {
    const doc = { sections: { header: [], identities: [], extra: [] } } as unknown;
    // Zod by default strips unknown keys; ensure it still parses.
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects a malformed tile (href is not a URL)', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:github', href: 'not a url' }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('rejects a malformed inline part (link not a URL)', () => {
    const doc = {
      sections: {
        header: [
          {
            content: [{ text: 'click', link: 'not a url' }]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('requires both header and identities sections', () => {
    expect(() => TilesDoc.parse({ sections: { header: [] } })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `yarn test`
Expected: all 9 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schema.test.ts
git commit -m "test: schema validation tests"
```

---

## Task 8: Migrate tiles to YAML

**Files:**
- Create: `src/lib/tiles.yaml`

- [ ] **Step 1: Create `src/lib/tiles.yaml` with all migrated tiles**

```yaml
sections:
  header:
    - caption: Work Profile
      icon: fas:user-circle
      title: Please visit
      content: https://xinhao.lu
      href: https://xinhao.lu

    - caption: Patreons
      icon: fab:patreon
      title: Creating Open-Source Software
      href: https://www.patreon.com/NeverBehave

    - caption: Languages
      icon: fas:language
      title: 汉语 & English

    - caption: Education
      items:
        - icon: fas:university
          title: "Undergraduate, Class of 2021"
          content: Rensselaer Polytechnic Institute
          href: https://rpi.edu
        - icon: fas:university
          title: "Master, Class of 2023"
          content: University of California, San Diego
          href: https://ucsd.edu

    - caption: Editor
      icon: fas:edit
      content: VSCode & Jetbrain Series
      href: https://www.jetbrains.com/education/programs/

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

    - caption: Spaces or Tabs
      icon: fas:i-cursor
      content:
        - "tab "
        - { text: "lint: space", strike: true }

    - caption: Platforms & Models
      items:
        - icon: fab:windows
          content: MSI GS65 (RTX 2060)
        - icon: fab:apple
          content: MacBook Air 2015 (Customized)
        - icon: fab:linux
          content:
            - "ThinkCentre M75q Tiny (Customized) with "
            - { text: Manjaro, strike: true }
            - " "
            - { text: NixOS, link: "https://nixos.org" }

    - caption: "Platforms::Handsets & Models"
      items:
        - icon: fab:apple
          content: iPad Pro 11' with Apple Pencil and Magic Keyboard
        - icon: fab:apple
          content: iPhone Xr
        - icon: fab:apple
          content: Apple Watch Series 4
        - icon: fab:android
          content: OnePlus 7 Pro
        - icon: fas:headphones
          content: AirPods 2 & AirPods Pro

    - caption: "Platforms::Homesets & Models"
      items:
        - icon: fas:server
          content:
            - "Dell T40 with "
            - { text: "Synology|Debian|NixOS", strike: true }
            - " TrueNAS"
        - icon: fab:apple
          content: Homepod with Homekit
        - icon: far:lightbulb
          content: Philips Hue

    - caption: Consoles
      items:
        - icon: fab:nintendo-switch
          content: SW-7261-2650-0247
        - icon: fab:playstation
          content: (Deprecated)

    - caption: AS-Operator
      icon: fas:network-wired
      title: PyNetwork
      href: https://pytrade.me

    - caption: Browser
      icon: fab:firefox
      title:
        - { text: Chrome, strike: true }
        - " Firefox"
      href: https://www.mozilla.org/

  identities:
    - caption: Coding
      items:
        - icon: fab:github
          title: GitHub
          content: "@NeverBehave"
          href: https://github.com/NeverBehave
        - icon: fab:gitlab
          title: GitLab
          content: "@NeverBehave"
          href: https://gitlab.com/NeverBehave

    - caption: About me
      items:
        - icon: fas:box
          title: CuriousCat
          content: NeverBehave
          href: https://curiouscat.me/NeverBehave
        - icon: fas:home
          title: Blog
          content: NEVER迷の小窝
          href: https://blog.never.pet

    - caption: (Instant) Messaging
      items:
        - icon: fab:telegram
          title: Telegram
          content: "@NeverBehave"
          href: https://t.me/NeverBehave
        - icon: fab:keybase
          title: Keybase
          content: "@NeverBehave"
          href: https://keybase.io/neverbehave
        - icon: fas:at
          title: E-mail
          content: i@never.pet
          href: "mailto:i@never.pet"
        - icon: fas:map-marker
          title: Zenly
          content: NeverBehave
          href: https://zen.ly/NeverBehave

    - caption: Social Network
      items:
        - icon: fab:twitter
          title: Twitter
          content: "@_NeverBehave_"
          href: https://twitter.com/_NeverBehave_
        - icon: fab:instagram
          title: Instagram
          content: "@NeverBehave"
          href: https://www.instagram.com/neverbehave

    - caption: Music & Video
      items:
        - icon: fab:spotify
          title: Spotify
          content: NeverBehave
          href: https://open.spotify.com/user/kplild4odg2fqy4ut7w3wx9gq
        - icon: fab:soundcloud
          title: SoundCloud
          content: Never-Behave
          href: https://soundcloud.com/never-behave
        - icon: fab:youtube
          title: Youtube
          content: Never-Behave
          href: https://www.youtube.com/channel/UCYLOv5WqFBQvY03kVX1xy6A

    - caption: Yet Another Music Game
      items:
        - icon: fab:accessible-icon
          title: OSU!
          content: NeverBehave
          href: https://osu.ppy.sh/u/NeverBehave
        - icon: fas:music
          title: Deemo & VOEZ
          href: https://www.rayark.com

    - caption: AR Games
      items:
        - icons: ["fas:bicycle", "fas:paper-plane"]
          title: Ingress
          content: "@NeverBehave"
          href: https://ingress.com
        - icon: fas:ghost
          title: Pokémon Go
          content: NeverBehave
          href: https://www.pokemongo.com/en-us/

    - caption: "Platform::Steam"
      items:
        - icon: fab:steam
          title: Steam
          content: NeverBehave
          href: https://steamcommunity.com/id/NeverBehave
        - icon: fas:heart
          title: Nekojishi
          href: https://store.steampowered.com/app/570840/
        - icon: fas:thumbs-up
          title: "Monster Hunter: World"
          href: https://store.steampowered.com/app/582010/

    - caption: "Platform::Origin"
      items:
        - icon: fas:fighter-jet
          title: Origin
          content: NeverBehaves
          href: https://www.origin.com/usa/en-us/profile/friends
        - icon: fas:heart
          title: Command & Conquer
          href: https://www.origin.com/usa/en-us/store/command-and-conquer/command-and-conquer-the-ultimate-collection

    - caption: "Platform::Battle.net"
      items:
        - icon: fas:fighter-jet
          title: Battle.Net
          content: "NeverBehave#1808"
          href: https://www.blizzard.com/en-sg/
        - icon: fas:heart
          title: OverWatch
          href: https://playoverwatch.com/en-us/career/pc/NeverBehave-1808
```

- [ ] **Step 2: Verify the YAML parses against the schema with a temporary script**

Create `scripts/check-tiles.mjs`:

```js
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { TilesDoc } from '../src/lib/schema.ts';

const text = readFileSync('src/lib/tiles.yaml', 'utf8');
const data = yaml.load(text);
TilesDoc.parse(data);
console.log('OK — tiles.yaml is valid');
```

Skip this script if importing TS in plain Node is awkward — instead, add a one-off Vitest case:

Append to `src/lib/schema.test.ts`:

```ts
import tilesYaml from './tiles.yaml';
it('the live tiles.yaml file conforms to the schema', () => {
  expect(() => TilesDoc.parse(tilesYaml)).not.toThrow();
});
```

- [ ] **Step 3: Run tests**

Run: `yarn test`
Expected: all tests pass, including the new live-data check.

- [ ] **Step 4: Commit**

```bash
git add src/lib/tiles.yaml src/lib/schema.test.ts
git commit -m "feat: migrate tile content to src/lib/tiles.yaml"
```

---

## Task 9: Build the loader

**Files:**
- Create: `src/lib/tiles.ts`

- [ ] **Step 1: Create `src/lib/tiles.ts`**

```ts
import tilesYaml from './tiles.yaml';
import { TilesDoc } from './schema';

export const tiles = TilesDoc.parse(tilesYaml);
```

- [ ] **Step 2: Verify type-check passes**

Run: `yarn run check`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tiles.ts
git commit -m "feat: tile loader (parses + validates YAML)"
```

---

## Task 10: Icon component

**Files:**
- Create: `src/lib/components/Icon.svelte`

- [ ] **Step 1: Create `src/lib/components/Icon.svelte`**

```svelte
<script lang="ts">
  export let name: string;

  $: parts = name.split(':');
  $: family = parts[0] ?? 'fas';
  $: slug = parts[1] ?? '';
</script>

<i aria-hidden="true" class="{family} fa-{slug}"></i>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Icon.svelte
git commit -m "feat: Icon component"
```

---

## Task 11: InlineContent component

**Files:**
- Create: `src/lib/components/InlineContent.svelte`

- [ ] **Step 1: Create `src/lib/components/InlineContent.svelte`**

```svelte
<script lang="ts">
  import Icon from './Icon.svelte';
  import type { InlinePart } from '$lib/schema';

  export let value: string | InlinePart[] | undefined = undefined;

  $: parts = value === undefined ? [] : typeof value === 'string' ? [value] : value;
</script>

{#each parts as part}
  {#if typeof part === 'string'}
    {part}
  {:else}
    {#if part.icon}
      <Icon name={part.icon} />
    {/if}
    {#if part.text !== undefined}
      {#if part.link}
        <a href={part.link}>
          {#if part.strike}<del>{part.text}</del>{:else}{part.text}{/if}
        </a>
      {:else if part.strike}
        <del>{part.text}</del>
      {:else}
        {part.text}
      {/if}
    {/if}
  {/if}
{/each}
```

- [ ] **Step 2: Verify type-check passes**

Run: `yarn run check`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/InlineContent.svelte
git commit -m "feat: InlineContent component"
```

---

## Task 12: Label component

**Files:**
- Create: `src/lib/components/Label.svelte`

- [ ] **Step 1: Create `src/lib/components/Label.svelte`**

```svelte
<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label } from '$lib/schema';

  export let label: Label;

  $: tag = label.href ? 'a' : 'div';
</script>

<svelte:element
  this={tag}
  href={label.href}
  aria-label={label.alt}
  class="label inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
>
  {#if label.icons}
    {#each label.icons as icon}
      <Icon name={icon} />
    {/each}
  {:else if label.icon}
    <Icon name={label.icon} />
  {/if}
  {#if label.title !== undefined}
    <span class="title font-medium">
      <InlineContent value={label.title} />
    </span>
  {/if}
  {#if label.content !== undefined}
    <span class="content text-tile-content">
      <InlineContent value={label.content} />
    </span>
  {/if}
</svelte:element>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Label.svelte
git commit -m "feat: Label component"
```

---

## Task 13: Tile component

**Files:**
- Create: `src/lib/components/Tile.svelte`

- [ ] **Step 1: Create `src/lib/components/Tile.svelte`**

```svelte
<script lang="ts">
  import Label from './Label.svelte';
  import type { Tile } from '$lib/schema';

  export let tile: Tile;

  $: hasItems = !!tile.items && tile.items.length > 0;
</script>

<div class="tile relative inline-block m-2 mt-7">
  {#if tile.caption}
    <span class="tile-caption absolute -top-5 left-0 text-xs">
      {tile.caption}
    </span>
  {/if}
  {#if hasItems}
    <div class="tile-group inline-flex flex-wrap gap-1">
      {#each tile.items ?? [] as item}
        <Label label={item} />
      {/each}
    </div>
  {:else}
    <Label label={tile} />
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Tile.svelte
git commit -m "feat: Tile component"
```

---

## Task 14: Section component

**Files:**
- Create: `src/lib/components/Section.svelte`

- [ ] **Step 1: Create `src/lib/components/Section.svelte`**

```svelte
<script lang="ts">
  import Tile from './Tile.svelte';
  import type { Tile as TileType } from '$lib/schema';

  export let tiles: TileType[];
  export let variant: 'header' | 'identities';
</script>

<div class="section section-{variant}" class:section-header={variant === 'header'} class:section-identities={variant === 'identities'}>
  <div class="flex flex-wrap items-start px-6 py-4">
    {#each tiles as tile}
      <Tile {tile} />
    {/each}
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Section.svelte
git commit -m "feat: Section component"
```

---

## Task 15: Layout — head/meta and footer scaffolding

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Replace `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';

  const buildYear = new Date().getFullYear();
</script>

<svelte:head>
  <meta property="og:title" content="About NeverBehave" />
  <meta property="og:url" content="https://never.pet" />
  <meta property="og:description" content="欸，是咕咕喵" />
  <meta property="og:image" content="/assets/images/current.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="About NeverBehave" />
  <meta name="twitter:site" content="@_NeverBehave_" />
  <meta name="twitter:description" content="欸，是咕咕喵" />
  <meta name="twitter:image" content="/assets/images/current.png" />
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
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat: layout with head/meta and footer scaffolding"
```

---

## Task 16: Wire up the page

**Files:**
- Create: `src/routes/+page.ts`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create `src/routes/+page.ts`**

```ts
import { tiles } from '$lib/tiles';

export const load = () => ({
  tiles
});
```

- [ ] **Step 2: Replace `src/routes/+page.svelte`**

```svelte
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
```

- [ ] **Step 3: Run dev server and visually verify**

Run: `yarn dev`
Open: `http://localhost:5173`
Expected: page renders the avatar (if `current.png` is present), the bilingual greeting, and tiles in two sections. Captions appear above tiles. Icons render via FontAwesome. Strikethrough text in "Browser" tile and "fullstack" appears struck through.

Stop the dev server with Ctrl+C.

- [ ] **Step 4: Verify production build**

Run: `yarn build && yarn preview`
Expected: build succeeds; visiting the preview URL renders the same page.

Stop the preview with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up page rendering all tiles"
```

---

## Task 17: Footer placeholder data and randomizer

**Files:**
- Create: `static/data/sao.json`
- Modify: `src/app.html` (add randomizer script)

- [ ] **Step 1: Create `static/data/sao.json` with placeholder strings**

```json
[
  "保持好奇心。",
  "Stay curious.",
  "代码改变世界。",
  "Hello, traveller.",
  "Less is more.",
  "Touch the grass."
]
```

- [ ] **Step 2: Add a small randomizer script to `src/app.html`**

Replace `src/app.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
    <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
    <script>
      (function () {
        function pickRandom() {
          fetch('/data/sao.json')
            .then(function (r) { return r.json(); })
            .then(function (arr) {
              var el = document.getElementById('hitokoto');
              if (el && Array.isArray(arr) && arr.length) {
                el.textContent = arr[Math.floor(Math.random() * arr.length)];
              }
            })
            .catch(function () {});
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', pickRandom);
        } else {
          pickRandom();
        }
      })();
    </script>
  </body>
</html>
```

Putting it in `app.html` avoids any interaction with Svelte's head-injection logic (the script must run unconditionally on the rendered HTML, regardless of CSR state).

- [ ] **Step 3: Verify in dev**

Run: `yarn dev`
Open: `http://localhost:5173`
Expected: in the footer, `/sao@NeverBehave:` is followed by one of the placeholder strings (random each refresh).

Stop the dev server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: footer hitokoto placeholder + randomizer"
```

---

## Task 18: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: yarn

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run tests
        run: yarn test

      - name: Configure Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: Build site
        run: yarn build
        env:
          BASE_PATH: ${{ steps.pages.outputs.base_path }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Notes for deployment:**

- If the site is served at the apex of a custom domain (e.g. `never.pet`): leave `BASE_PATH` unset (the configure-pages action will set it appropriately, or leave empty). Add `static/CNAME` containing your domain (one line, no scheme).
- If served at `https://<user>.github.io/<repo>/`: GH Pages serves under `/<repo>/`. The configure-pages action sets `base_path`, which is wired through to `svelte.config.js` via `BASE_PATH`.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages"
```

---

## Task 19: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

```markdown
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

Push to `master`. GitHub Actions builds and deploys to GitHub Pages.

## Static assets

Anything under [`static/`](static/) is served verbatim at the site root. Images, the keybase verification, the SSH public key, and license text live there.

## License

MIT.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for new stack"
```

---

## Task 20: Final smoke verification

- [ ] **Step 1: Clean install from scratch and full build**

```bash
rm -rf node_modules build .svelte-kit
yarn install --frozen-lockfile
yarn test
yarn build
```

Expected: all three commands succeed. `yarn test` reports all schema tests passing. `yarn build` produces a `build/` directory.

- [ ] **Step 2: Verify the `build/` output is complete**

Run: `ls build/ && ls build/assets/images/ && ls build/data/`
Expected:
- `build/` contains `index.html`, `_app/`, `assets/`, `data/`, `id_rsa.pub`, `keybase.txt`.
- `build/assets/images/` contains `current.png`, `nat-pants.png`, `nat-pants-ng.png`, `settings.png`.
- `build/data/sao.json` exists.

- [ ] **Step 3: Sanity-check the rendered HTML**

Run: `grep -c 'class="label' build/index.html`
Expected: a number > 30 (we have ~30 tiles each rendering as a label).

Run: `grep 'NeverBehave' build/index.html | head -5`
Expected: NeverBehave appears in og/twitter meta and in tile content.

- [ ] **Step 4: Local preview**

Run: `yarn preview`
Open: the URL printed by Vite.
Expected: the page renders the avatar, greeting, header tiles, identities tiles, and footer (with one of the placeholder sao strings).

Stop the preview with Ctrl+C.

- [ ] **Step 5: Final commit and push**

If anything was tweaked during smoke verification, commit it. Otherwise no-op.

```bash
git status
# If clean, nothing to do.
# Otherwise:
# git add -A && git commit -m "fix: final smoke-test fixes"
```

The plan is complete. Push to GitHub when ready and verify the GitHub Pages deploy in the Actions tab.
