# Tile History — Design

**Date:** 2026-05-07
**Branch:** `feat/tile-history`
**Status:** Spec — pending implementation plan
**Follow-up spec:** Global year-dropdown / "rewind" UI (separate spec, not in this scope)

## Goal

Let any tile carry a chronological record of prior states alongside its current value, displayed as a swipeable per-tile carousel. Motivating case: the laptop tile changed from MSI GS65 to Framework 13; the user wants the latest shown prominently while keeping the prior state accessible without losing fidelity.

## Non-goals

- Global year selector that rewinds the whole page (deferred to follow-up spec).
- `until` field for retired items (PlayStation `(Deprecated)` case) — also follow-up.
- Replacing the existing inline-strikethrough pattern (`~~Chrome~~ Firefox`, `~~fullstack~~`, `~~lint: space~~`). That pattern is rhetorical/playful and serves a different purpose; it stays unchanged.
- Render-layer test infrastructure. Schema tests only — Svelte 5 + Vitest component setup is not in this repo and not justified by this feature alone.

## Distinction: playful strike vs. real history

Two patterns currently coexist in `tiles.yaml`. They look similar but mean different things and should be encoded differently.

| | Playful inline strike | Real history |
|---|---|---|
| What it is | Annotation on a value — rhetorical, stylistic | Timeline — sequence of facts over time |
| Reads as | "(not X) Y", a wink | "I used X in 2019, now Y in 2024" |
| Lives at | Inline text level (existing `{strike: true}` on `InlinePart`) | Label level (new `history` field) |
| Year-stampable? | No | Yes — that's the point |
| Examples in current YAML | `~~Chrome~~ Firefox`, `~~fullstack~~`, `~~lint: space~~` | (none yet — laptop, Linux box, Dell T40 belong here) |

The new `history` field never replaces inline strike. They coexist. A label can use both if appropriate.

## Schema

`src/lib/schema.ts` gains a `year` field on the shared label base and a `history` field on `Label`. A history entry is the same shape as a label minus its own `history` (preventing recursion).

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

const HistoryEntry = LabelBase;

const Label = LabelBase.extend({
  history: z.array(HistoryEntry).optional()
});

const Tile = Label.extend({
  caption: z.string().optional(),
  items: z.array(Label).optional()
});
```

### Field semantics

- **`year`** (optional, integer) — the year this state began. Displayed as a small badge on the panel. On the current label this works as a "since" marker; on a history entry it marks when the prior state began. Plain integer; no month/quarter precision in v1. Negative or future years accepted (no gating).
- **`history`** (optional, array of `LabelBase`) — prior states for this label, ordered by the author. Convention: newest-first (closest-to-current at index 0), so a reader scrolling rightward in the carousel moves backwards in time. The renderer does not sort; document order is the rendered order.
- A history entry can carry any field a label can — different `icon`, `href`, rich `content`, `icons[]`, etc. — so a state change that involves an icon swap (Windows laptop → Linux laptop) renders correctly.
- `history: []` is accepted and treated as "no history" at render time (no carousel chrome).

### Deferred (spec #2 will add)

- `until` (optional, integer) — the year this state ended. Used by the dropdown to hide retired items past their `until`.
- Cross-tile filtering rules for the dropdown.

## Granularity

Per-item, not per-group. For tiles with `items` (e.g., `Platforms & Models`), `history` attaches to each item independently. The group caption is unchanged.

Mixed dated and undated entries are allowed within a single `history` array. Document order is the rendered order regardless of which entries have `year` set.

## Rendering

All carousel logic lives in `src/lib/components/Label.svelte` (or a small extracted `LabelCarousel.svelte` if the file grows uncomfortably). When `history` is empty/absent, the component renders exactly as it does today.

### HTML shape (when history present)

```html
<div class="label-carousel inline-flex flex-col">
  <div class="panels overflow-x-auto snap-x snap-mandatory">
    <a class="panel snap-start" role="tabpanel" id="panel-0" href="...">  <!-- current; <a> if label.href, else <div> -->
      <span class="year-badge">2024</span>                                  <!-- if label.year -->
      [icon] [title] [content]
    </a>
    <div class="panel snap-start" role="tabpanel" id="panel-1">  <!-- history[0]; <a> if entry.href, else <div> -->
      <span class="year-badge">2019</span>
      [icon] [title] [content]
    </div>
    <!-- ...more history entries -->
  </div>
  <div class="dots" role="tablist">
    <button role="tab" aria-controls="panel-0" aria-label="Now / 2024" />
    <button role="tab" aria-controls="panel-1" aria-label="2019" />
    <!-- ...more dots -->
  </div>
</div>
```

The carousel wrapper is always a `<div>`, never a link. Each panel — including panel 0 (the current state) — is independently an `<a>` if its own data carries `href`, otherwise a `<div>`. So clicking on the current panel follows `label.href`; clicking on a history panel follows that entry's `href` (or does nothing if it has none). A history panel never inherits the current label's link.

### Width strategy

All panels in a given carousel render at the same width, equal to the widest panel's natural content width. Two viable implementations:

1. **CSS-only.** The `label-carousel` wrapper is `inline-block` with `width: max-content`. The `panels` container is `flex`, `overflow-x: auto`, `scroll-snap-type: x mandatory`. Each panel is `flex: 0 0 100%` — i.e., 100% of the panels container's width — and `scroll-snap-align: start`. The container's width is fed by the wrapper's `max-content`, which CSS computes as the widest panel's natural width. All other panels then expand to that width via `flex: 0 0 100%`.
2. **JS measure-and-pin fallback.** If the CSS-only approach produces visible glitches (typically due to subpixel rounding or rich content reflow), measure each panel's natural width on mount, take the max, set every panel to that width explicitly. Roughly 10 lines of Svelte.

Start with #1; fall back to #2 only if visible bugs surface.

The visible result either way: snapping to panel N puts panel N's left edge at the container's left edge, with no part of panel N±1 visible — exactly one entry on screen per snap stop.

### Year badge

- Rendered top-right of each panel.
- Typography: `text-xs font-mono`, muted color.
- Shown only when the panel's entry has a `year` field.
- The current panel shows its badge if `label.year` is set; otherwise no badge on the current panel.

### Dots

- One dot per panel, rendered below the panel container.
- Each dot is a `<button role="tab">` with `aria-label` derived from year (or `"Now"` for an unlabeled current panel).
- The active dot has higher contrast; inactive dots are muted.
- Clicking a dot calls `scrollEl.scrollTo({ left: panelOffsetLeft, behavior: 'smooth' })` (or `'auto'` under reduced motion).
- Active-dot tracking via `IntersectionObserver` on the panels, root = scroll container. Whichever panel has the largest intersection ratio wins. Approximately 15–20 lines of Svelte.

### Per-panel content rendering

Same `Icon` + `InlineContent` machinery as today. Rich content (`{ text, link, strike, icon }`), `icons: [...]`, and all existing label conventions work inside a history panel without further code.

### Mobile

Native horizontal swipe + CSS scroll-snap. No additional code.

### Desktop trackpad

Two-finger horizontal swipe behaves identically to mobile. No additional code.

### Desktop mouse-only

Year dots are the discoverability and interaction affordance. No chevron buttons in v1. If usability testing reveals dots aren't enough, chevrons can be added without schema or layout changes.

### Keyboard accessibility

- Each dot is a focusable `<button role="tab">` inside the dot row (`role="tablist"`).
- Left/right arrow keys on a focused dot advance focus to the adjacent dot and call the same `scrollTo` used by click.
- Each panel has `role="tabpanel"` and a stable `id`; each dot's `aria-controls` references its panel's id.
- The panels container itself is not focusable; interactive content inside panels (e.g., `<a>` panels) remains tab-focusable in document order.

### Reduced motion

`window.matchMedia('(prefers-reduced-motion: reduce)')` → dot-click `scrollTo` uses `behavior: 'auto'` instead of `'smooth'`. CSS scroll-snap itself is not animated; no further work.

## Data migration

Three existing tiles convert to the `history` field in this pass. All other tiles untouched.

### Laptop (Platforms & Models)

```yaml
- icon: fab:linux
  content: Framework 13
  year: 2024                # TODO: confirm exact year
  history:
    - year: 2019            # TODO: confirm exact year
      icon: fab:windows
      content: MSI GS65 (RTX 2060)
```

Year placeholders are marked with `# TODO` in the YAML; user fills in real years before merge.

### Linux box (Platforms & Models)

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

The current value loses its `~~Manjaro~~ NixOS` strikethrough; the Manjaro state moves into `history`. Year omitted (user does not remember).

### Dell T40 (Platforms::Homesets & Models)

```yaml
- icon: fas:server
  content: Dell T40 with TrueNAS
  history:
    - content: NixOS
    - content: Debian
    - content: Synology
```

Current loses `Synology|Debian|NixOS` pipe-jammed strike; each prior OS is its own history entry. Entries drop the "Dell T40 with" prefix because the current label provides the context.

### Not migrated

- **Phones, MacBook Air, AirPods, consoles** — no history information given; can be opted in later by editing YAML, no code change required.
- **PlayStation `(Deprecated)`** — needs `until`, which is spec #2.
- **Browser, Lang, Spaces or Tabs** — playful inline strike; intentionally left alone.
- **Education** — already has implicit timeline (`Class of 2021`, `Class of 2023`); no benefit from `history` here.

## Tests

`src/lib/schema.test.ts` is extended with focused cases:

- **Existing fixture round-trips** — the migrated `tiles.yaml` parses cleanly. Catches regressions in the migration itself.
- **`year` only, no history** — accepted.
- **`history: []`** — accepted (renderer treats as no history).
- **Valid `history` array** — accepted.
- **`year` as string** (`"2024"`) — rejected. Forces integers.
- **History entry with nested `history`** — rejected. Confirms one-level cap.
- **Negative year, year `0`, far-future year** — accepted (no gating).

No render-layer tests in v1.

## README updates

Extend the existing "Make it yours" section in `README.md`:

- Add a paragraph on the `history` field — what it is, when to use it (real chronology vs. playful inline strike), with the laptop YAML as the example.
- Note that `year` on the main label currently shows as a badge and will gain a global rewind via the planned year-dropdown spec.

The History section of `README.md` (atomicneko attribution) is unchanged.

## Out of scope (handled by spec #2)

- Global year-dropdown ("rewind") UI in the page header.
- `until` field on `LabelBase` for retired items.
- Cross-tile filtering rules when the dropdown is engaged.
- Default-state behavior (does the page render "as of now" or "as of all time"?).
- Per-tile state composition with the dropdown — likely the dropdown drives `scrollTo` on each tile's carousel, reusing this design's machinery.

Spec #1 is purposefully shaped so spec #2 is purely additive: schema gets `until`, the page gets a header control, no rewrite of `Label.svelte` required.

## Open items the user must resolve before merge

- Confirm exact `year` values for the laptop entries (currently `# TODO` placeholders).
- Verify the Manjaro link URL in the Linux box history entry (`https://manjaro.org`) is the desired target, since the current YAML doesn't link Manjaro.
- Confirm the year-dot count looks visually acceptable on the Dell T40 case (4 dots) — if not, the rendering may need a tighter dot style or a different indicator.
