# Tile History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `history` field on every tile/item so the homepage can render a per-tile horizontal snap carousel (current state + prior states), with year badges and clickable dot indicators.

**Architecture:** Schema gains a `LabelBase` (existing Label minus `history`) plus an integer `year` field. `Label` extends `LabelBase` with an optional `history: LabelBase[]` (one level deep — history entries cannot themselves carry history). All carousel rendering lives in a new `LabelCarousel.svelte` consumed by `Label.svelte` only when `history` is non-empty; tiles without history render exactly as today. Uses native CSS scroll-snap on mobile/trackpad, `IntersectionObserver` for active-dot tracking on a `role="tablist"` row of buttons for desktop mouse and keyboard users, and respects `prefers-reduced-motion`.

**Tech Stack:** SvelteKit 2 + Svelte 4, Vitest, Zod 4, Tailwind 3.4, TypeScript 5.4, `@modyfi/vite-plugin-yaml` for YAML imports.

**Spec:** `docs/superpowers/specs/2026-05-07-tile-history-design.md`

**Branch:** `feat/tile-history`

---

## Files Touched

- **Modify:** `src/lib/schema.ts` — extract `LabelBase`, add `year`, add `history`.
- **Modify:** `src/lib/schema.test.ts` — new tests for `year` and `history`.
- **Modify:** `src/lib/tiles.yaml` — migrate laptop, Linux box, Dell T40 entries to `history`.
- **Modify:** `tailwind.config.ts` — add `tile-history` muted color token.
- **Create:** `src/lib/components/LabelCarousel.svelte` — carousel container + dots + observers.
- **Modify:** `src/lib/components/Label.svelte` — branch on `label.history?.length` to render `LabelCarousel`.
- **Modify:** `README.md` — adoption note for the `history` field.

`Tile.svelte`, `Section.svelte`, `+page.svelte`, `+layout.svelte`, `Icon.svelte`, `InlineContent.svelte` — **untouched**.

---

### Task 1: Schema — extract `LabelBase` and add `year` field

**Files:**
- Modify: `src/lib/schema.ts`
- Test: `src/lib/schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Add these test cases to `src/lib/schema.test.ts` (place before the closing `});` of the `describe` block):

```ts
  it('accepts a label with an integer year', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:linux', content: 'Framework 13', year: 2024 }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects a label whose year is a string', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:linux', content: 'Framework 13', year: '2024' }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('rejects a label whose year is a non-integer', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:linux', content: 'Framework 13', year: 2024.5 }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('accepts a label with year zero, negative, or far future', () => {
    for (const year of [0, -42, 9999]) {
      const doc = {
        sections: {
          header: [{ content: 'placeholder', year }],
          identities: []
        }
      };
      expect(() => TilesDoc.parse(doc), `year=${year}`).not.toThrow();
    }
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `yarn test`

Expected: the four new tests fail (`year` field is unknown; Zod 4 strips unknown keys by default, so the *positive* tests will pass-by-stripping but the *negative* tests will fail — they expect throws but won't get them). Specifically:
- "accepts a label with an integer year" → passes vacuously (year stripped, doc still valid) ✓
- "rejects a label whose year is a string" → FAIL (no throw because year is stripped, not validated)
- "rejects a label whose year is a non-integer" → FAIL (same reason)
- "accepts a label with year zero..." → passes vacuously ✓

The two negative tests are the gating ones — they're what proves `year` is actually being validated.

- [ ] **Step 3: Refactor schema.ts to introduce LabelBase + year**

Replace the `Label` and `Tile` definitions in `src/lib/schema.ts` (lines 16–30) with:

```ts
const LabelBase = z.object({
  icon: z.string().optional(),
  icons: z.array(z.string()).optional(),
  title: RichString.optional(),
  content: RichString.optional(),
  href: z.string().url().optional(),
  alt: z.string().optional(),
  year: z.number().int().optional()
});
export type LabelBase = z.infer<typeof LabelBase>;

const Label = LabelBase;
export type Label = z.infer<typeof Label>;

const Tile = Label.extend({
  caption: z.string().optional(),
  items: z.array(Label).optional()
});
export type Tile = z.infer<typeof Tile>;
```

Note: at this step `Label` is just `LabelBase`. Task 2 will add the `history` field. We do this in two steps so each commit is one clean concept.

- [ ] **Step 4: Run tests to verify they all pass**

Run: `yarn test`

Expected: all tests pass, including the four new ones. The negative `year` tests now throw because `z.number().int()` rejects strings and floats.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts
git commit -m "$(cat <<'EOF'
feat(schema): extract LabelBase, add integer year field

Refactors Label into a LabelBase (the shared shape) and a Label that
currently equals it. Adds an optional integer `year` field to LabelBase,
so any label or label-item can carry the year its current state began.
EOF
)"
```

---

### Task 2: Schema — add `history` field on `Label`

**Files:**
- Modify: `src/lib/schema.ts`
- Test: `src/lib/schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Add these test cases to `src/lib/schema.test.ts` (after the year tests from Task 1):

```ts
  it('accepts a label with a history array of LabelBase entries', () => {
    const doc = {
      sections: {
        header: [
          {
            icon: 'fab:linux',
            content: 'Framework 13',
            year: 2024,
            history: [
              { year: 2019, icon: 'fab:windows', content: 'MSI GS65 (RTX 2060)' },
              { content: 'older laptop' }
            ]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts an empty history array', () => {
    const doc = {
      sections: {
        header: [{ content: 'a thing', history: [] }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects a history entry that itself carries history (no recursion)', () => {
    const doc = {
      sections: {
        header: [
          {
            content: 'current',
            history: [
              {
                content: 'previous',
                history: [{ content: 'older still' }]
              }
            ]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('accepts history on a group item', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Platforms',
            items: [
              {
                icon: 'fab:linux',
                content: 'Framework 13',
                history: [{ year: 2019, content: 'MSI GS65' }]
              }
            ]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn test`

Expected: the "rejects a history entry that itself carries history" test FAILS (Zod strips unknown nested `history` key, so it doesn't throw). The other three may pass vacuously since `history` is a stripped unknown key. The recursion-rejection test is the gating one.

- [ ] **Step 3: Add history field to Label**

In `src/lib/schema.ts`, replace the line:

```ts
const Label = LabelBase;
```

with:

```ts
const HistoryEntry = LabelBase.strict();

const Label = LabelBase.extend({
  history: z.array(HistoryEntry).optional()
});
```

The `.strict()` on `HistoryEntry` is what makes the no-recursion test fail loudly: a history entry with an unknown `history` key inside it now throws instead of silently stripping.

- [ ] **Step 4: Run tests to verify all pass**

Run: `yarn test`

Expected: all tests pass, including the four new ones from this task and all prior tests. The "live tiles.yaml" conformance test still passes because we haven't migrated yet — `history` is optional everywhere.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts
git commit -m "$(cat <<'EOF'
feat(schema): add optional history field on Label

History entries are LabelBase (no nested history). The strict variant
prevents accidental two-level nesting in YAML — a history entry that
carries its own `history` key is rejected at parse time.
EOF
)"
```

---

### Task 3: Migrate `tiles.yaml` — laptop, Linux box, Dell T40

**Files:**
- Modify: `src/lib/tiles.yaml`

- [ ] **Step 1: Migrate the laptop entry**

In `src/lib/tiles.yaml`, find the `Platforms & Models` section (currently around lines 53–65). Replace the `MSI GS65 (RTX 2060)` item:

Before:
```yaml
        - icon: fab:windows
          content: MSI GS65 (RTX 2060)
```

After:
```yaml
        - icon: fab:linux
          content: Framework 13
          year: 2024              # TODO: confirm year before merge
          history:
            - year: 2019          # TODO: confirm year before merge
              icon: fab:windows
              content: MSI GS65 (RTX 2060)
```

- [ ] **Step 2: Migrate the Linux box entry**

In the same `Platforms & Models` section, find the ThinkCentre entry (currently with the `~~Manjaro~~` strikethrough). Replace:

Before:
```yaml
        - icon: fab:linux
          content:
            - "ThinkCentre M75q Tiny (Customized) with "
            - { text: Manjaro, strike: true }
            - " "
            - { text: NixOS, link: "https://nixos.org" }
```

After:
```yaml
        - icon: fab:linux
          content:
            - "ThinkCentre M75q Tiny (Customized) with "
            - { text: NixOS, link: "https://nixos.org" }
          history:
            - content:
                - "ThinkCentre M75q Tiny (Customized) with "
                - { text: Manjaro, link: "https://manjaro.org" }
```

The current value loses its strikethrough; Manjaro moves into history with a real link instead of a strike.

- [ ] **Step 3: Migrate the Dell T40 entry**

In `tiles.yaml`, find the `Platforms::Homesets & Models` section (currently around lines 79–89). Replace the Dell T40 item:

Before:
```yaml
        - icon: fas:server
          content:
            - "Dell T40 with "
            - { text: "Synology|Debian|NixOS", strike: true }
            - " TrueNAS"
```

After:
```yaml
        - icon: fas:server
          content: Dell T40 with TrueNAS
          history:
            - content: NixOS
            - content: Debian
            - content: Synology
```

History entries drop the "Dell T40 with" prefix — the current panel provides context.

- [ ] **Step 4: Run tests to verify the live YAML still validates**

Run: `yarn test`

Expected: all tests pass, including the existing `'the live tiles.yaml file conforms to the schema'` test. If it fails, the migration is the cause — re-check indentation (YAML is whitespace-sensitive).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tiles.yaml
git commit -m "$(cat <<'EOF'
feat(tiles): migrate laptop, Linux box, Dell T40 to history field

Laptop: current Framework 13, MSI GS65 in history (years TODO).
Linux box: NixOS without strike, Manjaro moves into history.
Dell T40: TrueNAS as current, prior OSes (NixOS/Debian/Synology) as
history entries with the "Dell T40 with" prefix dropped.
EOF
)"
```

---

### Task 4: Tailwind — add `tile-history` muted color

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add the color token**

In `tailwind.config.ts`, extend the `colors` object. Replace:

```ts
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
```

with:

```ts
      colors: {
        'site-header': '#006080',
        'site-copyright': '#004d1a',
        'site-hosting': '#00802b',
        'tile-bg': '#eeeeee',
        'tile-title': '#333333',
        'tile-content': '#555555',
        'tile-history': '#888888',
        'caption-light': '#eeeeee',
        'caption-dark': '#333333'
      },
```

`#888888` is roughly halfway between `tile-content` (`#555555`) and `tile-bg` (`#eeeeee`) — visibly muted on the existing tile background but still legible.

- [ ] **Step 2: Verify Tailwind rebuilds**

Run: `yarn dev` in a separate terminal. Wait for the build to settle. Confirm no errors; leave it running for the next tasks.

(Vite picks up Tailwind config changes automatically — no manual rebuild needed.)

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(theme): add tile-history color token

Muted gray for the year badge and dot row in the upcoming carousel.
Sits between tile-content and tile-bg so it reads as secondary
without disappearing.
EOF
)"
```

---

### Task 5: Create `LabelCarousel.svelte` — panels + scroll-snap

**Files:**
- Create: `src/lib/components/LabelCarousel.svelte`

- [ ] **Step 1: Create the component**

Create `src/lib/components/LabelCarousel.svelte` with this content:

```svelte
<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  // The current state (panel 0) plus the history entries (panels 1..N).
  $: panels = [label, ...(label.history ?? [])] as LabelBase[];

  // Unique prefix per carousel instance so ARIA aria-controls IDs
  // don't collide when multiple carousels render on the same page.
  const cid = `c${Math.random().toString(36).slice(2, 9)}`;

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }
</script>

<div class="label-carousel inline-flex flex-col">
  <div class="panels flex overflow-x-auto snap-x snap-mandatory">
    {#each panels as p, i}
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        role="tabpanel"
        id={`${cid}-panel-${i}`}
        class="panel snap-start flex-[0_0_100%] relative inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
      >
        {#if p.year !== undefined}
          <span class="year-badge absolute top-1 right-2 text-xs font-mono text-tile-history">
            {p.year}
          </span>
        {/if}
        {#if p.icons}
          {#each p.icons as icon}
            <Icon name={icon} />
          {/each}
        {:else if p.icon}
          <Icon name={p.icon} />
        {/if}
        {#if p.title !== undefined}
          <span class="title font-medium">
            <InlineContent value={p.title} />
          </span>
        {/if}
        {#if p.content !== undefined}
          <span class="content text-tile-content">
            <InlineContent value={p.content} />
          </span>
        {/if}
      </svelte:element>
    {/each}
  </div>
</div>
```

This component:
- Renders one panel per `[label, ...history]` entry.
- Each panel is `<a>` if it has its own `href`, otherwise `<div>`.
- Each panel has `flex: 0 0 100%` so all panels share the carousel's content-box width; the carousel sizes to its widest panel via `inline-flex flex-col` on the wrapper plus natural `max-content` width on each panel's flex layout.
- Panel 0 + each history panel show a year badge in the top-right corner if `year` is set.
- The `cid` prefix ensures IDs are unique across carousel instances (we have at least three on the homepage: laptop, Linux box, Dell T40).

(Width pinning via the JS measure-and-pin fallback is deferred to Task 9 if visual testing reveals it's needed.)

- [ ] **Step 2: Wire it into Label.svelte temporarily for visual test**

Open `src/lib/components/Label.svelte` and **temporarily** replace its entire content (we'll restore the proper branching in Task 11) with:

```svelte
<script lang="ts">
  import LabelCarousel from './LabelCarousel.svelte';
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label } from '$lib/schema';

  export let label: Label;

  $: hasHistory = !!label.history && label.history.length > 0;
  $: tag = label.href ? 'a' : 'div';
</script>

{#if hasHistory}
  <LabelCarousel {label} />
{:else}
  <svelte:element
    this={tag}
    {...(label.href ? { href: label.href } : {})}
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
{/if}
```

(This is the final shape of `Label.svelte` — wire-in happens here in Task 5 so we can iterate visually on `LabelCarousel` over the following tasks. The remaining tasks only modify `LabelCarousel.svelte`.)

- [ ] **Step 3: Visual verification**

If `yarn dev` is not running, start it: `yarn dev`. Open http://localhost:5173.

Verify:
- The laptop tile shows Framework 13 with a `2024` year badge in the corner.
- Swiping (touch / two-finger trackpad) horizontally on the laptop tile reveals the MSI GS65 panel with a `2019` badge.
- The Linux box shows ThinkCentre with NixOS; swiping reveals the Manjaro state.
- The Dell T40 shows current with TrueNAS; swiping reveals NixOS, Debian, Synology in order.
- All other tiles are visually unchanged.

If panels appear to share width but snap-stops feel "off" (e.g., snapping reveals fragments of the next panel), proceed but note for Task 6 — we'll add JS measure-and-pin if the CSS-only width is insufficient.

- [ ] **Step 4: Type-check**

Run: `yarn check`

Expected: no errors. If you see "type Label has no property history" or similar, Task 1/2 wasn't completed — go back.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/LabelCarousel.svelte src/lib/components/Label.svelte
git commit -m "$(cat <<'EOF'
feat(carousel): scaffold LabelCarousel with scroll-snap panels

Renders [current, ...history] as snap-x panels. Each panel uses the
existing Icon + InlineContent machinery so rich content, icons, and
hrefs work in history entries without further plumbing. Year badges
render in the top-right corner when an entry carries a year.

Label.svelte now branches: tiles without history render as today;
tiles with history render via LabelCarousel.
EOF
)"
```

---

### Task 6: `LabelCarousel.svelte` — dot row with click-to-scroll

**Files:**
- Modify: `src/lib/components/LabelCarousel.svelte`

- [ ] **Step 1: Replace the entire file with the dot-row version**

Replace the entire content of `src/lib/components/LabelCarousel.svelte` with:

```svelte
<script lang="ts">
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  $: panels = [label, ...(label.history ?? [])] as LabelBase[];

  const cid = `c${Math.random().toString(36).slice(2, 9)}`;

  let scrollEl: HTMLDivElement;
  let activeIndex = 0;

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }

  function dotLabel(p: LabelBase, i: number): string {
    if (i === 0) return p.year !== undefined ? `Now (${p.year})` : 'Now';
    return p.year !== undefined ? String(p.year) : `Earlier ${i}`;
  }

  function scrollToPanel(i: number) {
    if (!scrollEl) return;
    const panel = scrollEl.children[i] as HTMLElement | undefined;
    if (!panel) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollEl.scrollTo({ left: panel.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    activeIndex = i;
  }
</script>

<div class="label-carousel inline-flex flex-col">
  <div class="panels flex overflow-x-auto snap-x snap-mandatory" bind:this={scrollEl}>
    {#each panels as p, i}
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        role="tabpanel"
        id={`${cid}-panel-${i}`}
        class="panel snap-start flex-[0_0_100%] relative inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
      >
        {#if p.year !== undefined}
          <span class="year-badge absolute top-1 right-2 text-xs font-mono text-tile-history">
            {p.year}
          </span>
        {/if}
        {#if p.icons}
          {#each p.icons as icon}
            <Icon name={icon} />
          {/each}
        {:else if p.icon}
          <Icon name={p.icon} />
        {/if}
        {#if p.title !== undefined}
          <span class="title font-medium">
            <InlineContent value={p.title} />
          </span>
        {/if}
        {#if p.content !== undefined}
          <span class="content text-tile-content">
            <InlineContent value={p.content} />
          </span>
        {/if}
      </svelte:element>
    {/each}
  </div>

  {#if panels.length > 1}
    <div class="dots flex gap-1 mt-1 px-1" role="tablist">
      {#each panels as p, i}
        <button
          type="button"
          role="tab"
          aria-controls={`${cid}-panel-${i}`}
          aria-selected={activeIndex === i}
          aria-label={dotLabel(p, i)}
          class="dot w-2 h-2 rounded-full transition-colors"
          class:bg-tile-content={activeIndex === i}
          class:bg-tile-history={activeIndex !== i}
          on:click={() => scrollToPanel(i)}
        ></button>
      {/each}
    </div>
  {/if}
</div>
```

Diff from Task 5:
- Added `scrollEl` ref via `bind:this`.
- Added `activeIndex` state.
- Added `dotLabel` and `scrollToPanel` helpers (the latter respects `prefers-reduced-motion`).
- Added the `dots` row after the `panels` div, with a button per panel.
- Active dot uses `bg-tile-content`; inactive uses `bg-tile-history`.
- The dot row is gated by `panels.length > 1` (defensive — in practice the carousel only mounts when history is non-empty).

- [ ] **Step 2: Visual verification**

Reload http://localhost:5173.

Verify:
- A row of small dots appears below each carousel-mode tile (laptop, Linux box, Dell T40).
- Dell T40 has 4 dots (current + 3 history); laptop has 2; Linux box has 2.
- Clicking a dot smoothly scrolls the panels to that entry.
- Active dot is darker (`bg-tile-content`), inactive dots are muted (`bg-tile-history`).
- BUT: clicking the same dot twice or scrolling manually leaves `activeIndex` desynced from the actual scroll position (we'll fix this in Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/LabelCarousel.svelte
git commit -m "$(cat <<'EOF'
feat(carousel): add clickable year-dot indicators

A role=tablist row of buttons under each multi-panel tile, one button
per panel. Clicking a dot smoothly scrolls to the corresponding panel
(instant under prefers-reduced-motion). aria-controls links each dot
to its panel id. Active state is locally tracked via click handler;
scroll-driven sync arrives in the next task.
EOF
)"
```

---

### Task 7: `LabelCarousel.svelte` — IntersectionObserver active-dot tracking

**Files:**
- Modify: `src/lib/components/LabelCarousel.svelte`

- [ ] **Step 1: Replace the entire file with the observer version**

Replace the entire content of `src/lib/components/LabelCarousel.svelte` with:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from './Icon.svelte';
  import InlineContent from './InlineContent.svelte';
  import type { Label, LabelBase } from '$lib/schema';

  export let label: Label;

  $: panels = [label, ...(label.history ?? [])] as LabelBase[];

  const cid = `c${Math.random().toString(36).slice(2, 9)}`;

  let scrollEl: HTMLDivElement;
  let activeIndex = 0;
  let observer: IntersectionObserver | undefined;

  function panelTag(p: LabelBase): 'a' | 'div' {
    return p.href ? 'a' : 'div';
  }

  function dotLabel(p: LabelBase, i: number): string {
    if (i === 0) return p.year !== undefined ? `Now (${p.year})` : 'Now';
    return p.year !== undefined ? String(p.year) : `Earlier ${i}`;
  }

  function scrollToPanel(i: number) {
    if (!scrollEl) return;
    const panel = scrollEl.children[i] as HTMLElement | undefined;
    if (!panel) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollEl.scrollTo({ left: panel.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    // activeIndex is updated by the observer, not here — avoids flicker
    // if the user swipes mid-scroll.
  }

  onMount(() => {
    if (!scrollEl) return;
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) activeIndex = idx;
        }
      },
      { root: scrollEl, threshold: [0.5, 0.9] }
    );
    for (const child of Array.from(scrollEl.children)) {
      observer.observe(child);
    }
  });

  onDestroy(() => {
    observer?.disconnect();
  });
</script>

<div class="label-carousel inline-flex flex-col">
  <div class="panels flex overflow-x-auto snap-x snap-mandatory" bind:this={scrollEl}>
    {#each panels as p, i}
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        role="tabpanel"
        id={`${cid}-panel-${i}`}
        data-index={i}
        class="panel snap-start flex-[0_0_100%] relative inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
      >
        {#if p.year !== undefined}
          <span class="year-badge absolute top-1 right-2 text-xs font-mono text-tile-history">
            {p.year}
          </span>
        {/if}
        {#if p.icons}
          {#each p.icons as icon}
            <Icon name={icon} />
          {/each}
        {:else if p.icon}
          <Icon name={p.icon} />
        {/if}
        {#if p.title !== undefined}
          <span class="title font-medium">
            <InlineContent value={p.title} />
          </span>
        {/if}
        {#if p.content !== undefined}
          <span class="content text-tile-content">
            <InlineContent value={p.content} />
          </span>
        {/if}
      </svelte:element>
    {/each}
  </div>

  {#if panels.length > 1}
    <div class="dots flex gap-1 mt-1 px-1" role="tablist">
      {#each panels as p, i}
        <button
          type="button"
          role="tab"
          aria-controls={`${cid}-panel-${i}`}
          aria-selected={activeIndex === i}
          aria-label={dotLabel(p, i)}
          class="dot w-2 h-2 rounded-full transition-colors"
          class:bg-tile-content={activeIndex === i}
          class:bg-tile-history={activeIndex !== i}
          on:click={() => scrollToPanel(i)}
        ></button>
      {/each}
    </div>
  {/if}
</div>
```

Diff from Task 6:
- Added `onMount` / `onDestroy` imports.
- Added `observer: IntersectionObserver | undefined`.
- Added `onMount` body that observes each panel against the scroll container; updates `activeIndex` based on largest visible intersection ratio.
- Added `onDestroy` to disconnect the observer.
- Added `data-index={i}` on each panel so the observer can map an entry back to its index.
- Removed the `activeIndex = i;` assignment from `scrollToPanel` — the observer now drives `activeIndex` from actual scroll position, eliminating flicker if the user interrupts a programmatic scroll.

- [ ] **Step 2: Visual verification**

Reload http://localhost:5173.

Verify:
- Manually swiping the carousel updates the active dot as each panel comes into view.
- Clicking a dot smoothly scrolls; the active dot updates as the scroll lands.
- Resizing the window or rotating a phone doesn't crash the observer.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/LabelCarousel.svelte
git commit -m "$(cat <<'EOF'
feat(carousel): track active panel via IntersectionObserver

The observer watches each panel against the scroll container as root,
picks whichever has the highest intersection ratio, and updates the
active dot. Scroll-driven manual swipes now keep the dot row in sync.
Cleanup on destroy.
EOF
)"
```

---

### Task 8: `LabelCarousel.svelte` — keyboard arrow navigation

**Files:**
- Modify: `src/lib/components/LabelCarousel.svelte`

- [ ] **Step 1: Add the keydown handler and attach it to the dot row**

In `src/lib/components/LabelCarousel.svelte`, add this function inside `<script>`, immediately after `scrollToPanel`:

```ts
  function onDotKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = e.key === 'ArrowLeft' ? activeIndex - 1 : activeIndex + 1;
    if (next < 0 || next >= panels.length) return;
    scrollToPanel(next);
    const btns = (e.currentTarget as HTMLElement).querySelectorAll('button');
    (btns[next] as HTMLButtonElement | undefined)?.focus();
  }
```

Change the `dots` div opening tag from:

```svelte
    <div class="dots flex gap-1 mt-1 px-1" role="tablist">
```

to:

```svelte
    <div class="dots flex gap-1 mt-1 px-1" role="tablist" on:keydown={onDotKeydown}>
```

These two edits are the only changes from Task 7. The rest of the file is unchanged.

- [ ] **Step 2: Visual & keyboard verification**

Reload http://localhost:5173.

Verify with keyboard:
- Tab into a dot row.
- Arrow-right: focus moves to next dot, panels scroll to that index.
- Arrow-left: previous dot. Stops at first dot (no wrap-around).
- Arrow-up/down: no effect.
- Tab leaves the dot row to the next focusable element.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/LabelCarousel.svelte
git commit -m "$(cat <<'EOF'
feat(carousel): keyboard arrow nav on dot row

ArrowLeft / ArrowRight on a focused dot moves focus and scroll to the
adjacent panel; bounded at the ends (no wrap). preventDefault stops
the page from horizontally scrolling.
EOF
)"
```

---

### Task 9: `LabelCarousel.svelte` — width measurement fallback (only if needed)

**Files:**
- Modify: `src/lib/components/LabelCarousel.svelte`

This task is **conditional**: only do it if Task 5's visual verification revealed width-pinning issues (snap stops misaligned, panels of different visible widths, fractional positions). If the CSS-only `flex: 0 0 100%` strategy already produces a stable carousel, **skip to Task 10** and leave a note in the task list (`Task 9: skipped — CSS-only width sufficient`).

- [ ] **Step 1: Add measure-and-pin logic**

Two changes in `src/lib/components/LabelCarousel.svelte`:

**Change 1.** Add a new state variable below the existing `let observer: ...` declaration:

```ts
  let pinnedWidth: number | undefined;
```

**Change 2.** Replace the entire `onMount` body with this expanded version:

```ts
  onMount(() => {
    if (!scrollEl) return;

    // Measure each panel's natural width before any flex adjustment kicks
    // in, then pin every panel to the maximum so snap stops align cleanly.
    const widths = Array.from(scrollEl.children).map(
      (el) => (el as HTMLElement).getBoundingClientRect().width
    );
    pinnedWidth = Math.max(...widths);

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) activeIndex = idx;
        }
      },
      { root: scrollEl, threshold: [0.5, 0.9] }
    );
    for (const child of Array.from(scrollEl.children)) {
      observer.observe(child);
    }
  });
```

**Change 3.** Replace `flex-[0_0_100%]` in the panel element's class string with a reactive `style` attribute. The current panel element opens like:

```svelte
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        role="tabpanel"
        id={`${cid}-panel-${i}`}
        data-index={i}
        class="panel snap-start flex-[0_0_100%] relative inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
      >
```

Change it to:

```svelte
      <svelte:element
        this={panelTag(p)}
        {...(p.href ? { href: p.href } : {})}
        aria-label={p.alt}
        role="tabpanel"
        id={`${cid}-panel-${i}`}
        data-index={i}
        class="panel snap-start relative inline-flex items-baseline gap-1 px-3 py-2 bg-tile-bg shadow-tile rounded-md text-tile-title font-light leading-none no-underline"
        style={pinnedWidth !== undefined ? `flex: 0 0 ${pinnedWidth}px` : 'flex: 0 0 max-content'}
      >
```

Caveat: `getBoundingClientRect` runs after initial paint, so there's a brief frame where panels render at `max-content` before the JS pins them. Tolerable for this use case.

- [ ] **Step 2: Visual verification**

Reload http://localhost:5173.

Verify:
- Panels in a multi-state tile are visibly the same width.
- Snap stops land cleanly on each panel's left edge.
- No horizontal jitter on initial load.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/LabelCarousel.svelte
git commit -m "$(cat <<'EOF'
fix(carousel): pin all panels to widest natural width via JS measure

CSS-only flex:0_0_100% was insufficient for snap stop alignment;
measuring on mount and pinning every panel's flex-basis to the
widest panel's width fixes it.
EOF
)"
```

---

### Task 10: README — adoption note for the `history` field

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Extend the "Make it yours" section**

In `README.md`, find the "Make it yours" section. After the existing numbered list and the "Drop a tile by deleting its block..." sentence, add a new subsection:

```markdown
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

The current value renders as the first carousel panel; history entries follow in document order (newest-first by convention). Each panel shows a small year badge if its entry has a `year`, and a row of clickable dots underneath lets you jump between panels — or swipe horizontally on touch / trackpad.

History entries cannot themselves carry `history` (one level deep). Use this for laptops you've replaced, server OSes you've migrated through, anything with a "what came before" worth keeping. Don't use it to encode "I tried X but went with Y" — that's what inline strike is for.
```

- [ ] **Step 2: Render-check the README**

Open `README.md` in your IDE preview (or just eyeball the diff). Verify the markdown indentation is correct — the YAML code fence should sit at the section level, not nested under a list item.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: explain the history field in the adoption section

Distinguishes real chronology (history field) from playful inline
strike, with the laptop example. Notes the one-level-deep cap.
EOF
)"
```

---

### Task 11: Final verification

**Files:** none modified.

- [ ] **Step 1: Type-check**

Run: `yarn check`

Expected: zero errors, zero warnings related to this branch's changes.

- [ ] **Step 2: Tests**

Run: `yarn test`

Expected: all tests pass — original tests plus the new `year`/`history` tests.

- [ ] **Step 3: Production build**

Run: `yarn build`

Expected: build succeeds, output in `build/`. No errors about missing imports or invalid YAML.

- [ ] **Step 4: Manual browser smoke test**

Run: `yarn preview` (serves the production build).

Navigate to http://localhost:4173 (default preview port; check console output for actual URL).

Verify:
- Laptop tile: Framework 13 + `2024` badge; swipe/click reveals MSI GS65 + `2019` badge.
- Linux box: NixOS panel; swipe/click reveals Manjaro panel.
- Dell T40: TrueNAS panel; 4 dots; swipe/click cycles through TrueNAS → NixOS → Debian → Synology.
- All other tiles unchanged from before this branch.
- No console errors.
- Hard refresh (Cmd-Shift-R) — no flash of unstyled content; carousel renders correctly on first paint.

If any verification step fails, fix the offending code, re-run all four steps. Don't proceed until everything is green.

- [ ] **Step 5: Resolve TODOs in tiles.yaml**

Open `src/lib/tiles.yaml` and find the `# TODO: confirm year` markers added in Task 3. Replace placeholder years with the actual values. (This step is *user-driven* — the implementing agent should pause here and ask the user for the real years before committing.)

After confirmation, commit:

```bash
git add src/lib/tiles.yaml
git commit -m "$(cat <<'EOF'
docs(tiles): confirm laptop history years
EOF
)"
```

- [ ] **Step 6: Push branch and open PR**

(Only if the user has authorized pushing. Do not push without explicit go-ahead.)

```bash
git push -u origin feat/tile-history
```

Then open a PR via `gh pr create` (or wait for the user to do so).

---

## Self-Review

Spec coverage check:
- Schema changes (year + history + LabelBase + no-recursion) → Tasks 1, 2 ✓
- YAML migration for laptop, Linux box, Dell T40 → Task 3 ✓
- Tailwind color token → Task 4 ✓
- Component rendering (panels, scroll-snap, year badge, href per-panel) → Task 5 ✓
- Dot row + click-to-scroll → Task 6 ✓
- IntersectionObserver active tracking → Task 7 ✓
- Keyboard arrow nav → Task 8 ✓
- Width strategy with JS fallback → Task 9 (conditional) ✓
- Reduced motion → Task 6's `scrollToPanel` (handles `prefers-reduced-motion`) ✓
- ARIA roles (`tablist`, `tab`, `tabpanel`, `aria-controls`, `aria-selected`) → Tasks 5/6 ✓
- README updates → Task 10 ✓
- Final type-check / test / build / smoke → Task 11 ✓

No placeholder language. No "TBD" or "implement appropriate handling." Every code step shows full code. Commit messages are concrete.

Type consistency check: `LabelBase`, `Label`, `HistoryEntry` named consistently across tasks. `panelTag`, `scrollToPanel`, `dotLabel`, `onDotKeydown` reused, not redefined. `activeIndex`, `scrollEl`, `observer`, `pinnedWidth` are the only state variables and they're introduced once.

One known nuance: Task 9 is conditional. The implementer must visually evaluate after Task 5 whether to do Task 9 — otherwise it's wasted work.
