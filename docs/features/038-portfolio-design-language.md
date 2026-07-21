# Spec 038 — Adopt the portfolio design language (adnanreza.com parity)

## Context

adnanreza.com lists this explorer as a project; the two should read as one body of work. The portfolio's design language is quiet-editorial: cool paper and near-black ink, hairline rules instead of cards and shadows, Inter Tight for display and body, JetBrains Mono for uppercase micro-labels, one restrained blue used almost exclusively for links and data. The explorer currently speaks shadcn: white cards with 12px radii and soft shadows, filled Mobi-blue buttons, system fonts, light-only.

Owner decisions: portfolio blue replaces Mobi blue everywhere; full dark-mode parity with a nav toggle; Inter Tight + JetBrains Mono self-hosted. No copy, layout, or IA changes — sections, scrollspy, accessibility work from specs 032–037 all stay.

## The measured design language

Tokens read from adnanreza.com's compiled CSS (`:root` / `:root[data-theme="dark"]`):

| Token | Light | Dark |
|---|---|---|
| paper (bg) | `#f7f9fb` | `#0b0b0b` |
| paper-2 (raised bg) | `#f1f4f6` | `#161616` |
| ink (fg) | `#090e11` | `#ededed` |
| ink-2 | `#2d3438` | `#bebebe` |
| muted | `#636a6f` | `#959595` |
| muted-2 | `#94999d` | `#5d5d5d` |
| rule (hairline) | `#d4d8db` | `#2e2e2e` |
| rule-2 | `#e2e5e8` | `#222222` |
| accent | `#196ea9` | `#5fa5de` |
| accent-ink (hover) | `#004676` | `#79b8ed` |

Type: sans = Inter Tight, mono = JetBrains Mono. Scale: display `clamp(56px, 9vw, 136px)` at weight 500, line-height 0.95, tracking −0.024em; h1 `clamp(40px, 5vw, 68px)`; h2 `clamp(28px, 2.6vw, 40px)`; h3 `clamp(20px, 1.5vw, 24px)`; body 17px; small 13px; tiny 11px. The signature **eyebrow** pattern — mono, 11px, uppercase, letter-spacing 0.14em, muted — labels every section and piece of metadata.

Structure: max-width 1240px, gutter `clamp(24px, 4.5vw, 56px)`. No cards, no shadows, no fills — 1px hairline rules are the only structural chrome; border-radius is nearly absent (2–8px on rare elements). Links underline via `border-bottom: 1px solid muted-2` and darken to ink or accent-ink on hover; there are no filled buttons; CTAs are mono 14px underlined links. Focus is `outline: 2px solid ink; outline-offset: 3px`. Motion: 0.42s transitions, `cubic-bezier(.22,.61,.36,1)` ease, 0.65s rise-in reveals (translateY 16px → 0).

## Goal

Re-skin the explorer so tokens, type, structure, motion, charts, and map match adnanreza.com in both light and dark, without regressing tests, responsiveness, or reduced-motion behavior.

## Changes

**1. Tokens — src/index.css.** Rewrite the `:root` block, keeping the existing shadcn variable names so every component class keeps working, and add a `.dark` block (Tailwind `darkMode: ["class"]` is already configured):

| Variable | Light | Dark | Portfolio source |
|---|---|---|---|
| `--background` | `#f7f9fb` | `#0b0b0b` | paper |
| `--foreground` | `#090e11` | `#ededed` | ink |
| `--card` | `#f1f4f6` | `#161616` | paper-2 |
| `--card-foreground` | `#090e11` | `#ededed` | ink |
| `--primary` | `#196ea9` | `#5fa5de` | accent |
| `--primary-foreground` | `#f7f9fb` | `#0b0b0b` | paper |
| `--secondary` | `#f1f4f6` | `#161616` | paper-2 |
| `--secondary-foreground` | `#2d3438` | `#bebebe` | ink-2 |
| `--muted` | `#f1f4f6` | `#161616` | paper-2 |
| `--muted-foreground` | `#636a6f` | `#959595` | muted |
| `--accent` | accent wash (~8% alpha equivalent) | dark accent tint | accent wash |
| `--accent-foreground` | `#004676` | `#79b8ed` | accent-ink |
| `--border` | `#d4d8db` | `#2e2e2e` | rule |
| `--input` | `#d4d8db` | `#2e2e2e` | rule |
| `--ring` | `#196ea9` | `#5fa5de` | accent |
| `--radius` | `0.5rem` | same | max radius observed |

Values are stored as HSL triplets to fit the existing `hsl(var(--x))` plumbing; the hex above is the source of truth. Also add `--muted-2` (`#94999d` / `#5d5d5d`) and `--rule-2` (`#e2e5e8` / `#222222`) as new vars for link underlines and secondary hairlines, and set `color-scheme: light` / `dark` on `:root` / `.dark`.

**2. Fonts.** Add `@fontsource-variable/inter-tight` and `@fontsource-variable/jetbrains-mono`; import latin subsets in src/main.tsx. In tailwind.config.ts set `fontFamily.sans` (Inter Tight first, current stack as fallback) and `fontFamily.mono` (JetBrains Mono first). Keep `font-feature-settings "tnum"` for data. Body text on prose sections moves to 17px/1.55 to match the portfolio's reading size.

**3. Tailwind theme — tailwind.config.ts.** Radius scale: `lg: 0.5rem, md: 0.375rem, sm: 0.25rem`. Delete `boxShadow.soft` (nothing casts shadows in this language; grep and remove `shadow-soft`/`shadow-sm` usages). Retune motion to portfolio timing: `fade-up 650ms cubic-bezier(.22,.61,.36,1)`; the `.reveal-stagger` utility in src/index.css adopts the same ease, transitions drop to 420ms.

**4. Eyebrow utility + section headers.** Add `.eyebrow` (mono, 11px, uppercase, tracking .14em, `--muted-foreground`) in `@layer utilities`. Every section header converts to the portfolio pattern: eyebrow label (OVERVIEW, NINE YEARS, FORECAST, FLOWS, MAP, SIGNALS, METHODOLOGY) above an Inter Tight heading at `clamp(28px, 2.6vw, 40px)` weight 500. Hero h1 moves to `clamp(40px, 7vw, 96px)`, weight 500, line-height 0.95, tracking −0.024em, with a mono eyebrow above it.

**5. Dark-mode plumbing.** New `ThemeProvider`/`useTheme` (src/lib/theme.tsx): state from `localStorage("theme")` → `prefers-color-scheme` fallback; toggles `dark` class on `<html>`; persists. Inline pre-hydration script in index.html sets the class before first paint (no FOUC). Toggle button (lucide `Moon`/`Sun`, `aria-label`, `aria-pressed`) at the far right of the nav in src/components/AppShell.tsx, matching the portfolio's placement.

**6. Component re-skin.**

- Card (src/components/ui/card.tsx): flat — `bg-card border-border` hairline, `rounded-lg` (now 8px), **no shadow**. Boxes are reserved for data surfaces (charts, map, calendar); prose sections lose their boxes and become open `border-t border-border` ruled blocks, like the portfolio's section dividers.
- Button (src/components/ui/button.tsx): `default` becomes quiet — transparent bg, 1px `--border`, `rounded-md`, ink text, hover `border-foreground`; add a `cta` variant = the portfolio's `.cta-link` (mono 14px, tracking .04em, `border-b border-muted-2`, hover border-ink). Filled primary disappears.
- Badge (src/components/ui/badge.tsx): from pill to portfolio tag — mono 11px uppercase tracking .14em muted; `outline` variant keeps a hairline border, `rounded-sm`.
- Table (src/components/ui/table.tsx): drop the striped `bg-secondary` header; headers become mono 11px uppercase muted on a hairline `border-b`; rows hairline-ruled, hover `bg-card`.
- Links in prose/footer: `border-b` in `--muted-2`, hover `border-foreground text-foreground`, matching portfolio underline behavior.
- Focus: replace ring classes with global `:focus-visible { outline: 2px solid var(--foreground); outline-offset: 3px; border-radius: 2px }`.
- Nav: brand in Inter Tight 15px/500 lowercase; links 15px muted → ink; active section underlined (scrollspy logic unchanged); hairline `border-b`; keep the blur/backdrop.
- Skeletons: no changes needed — they draw from `bg-muted`/`border-border`, which now theme correctly in dark.

**7. Charts — src/components/charts/chartTheme.ts.** Convert the static object to a `makeChartTheme(theme: "light" | "dark")` factory: accent `#196ea9`/`#5fa5de` replaces `#008fd3`; ink `#090e11`/`#ededed`; grid from rule at low alpha; tick + legend labels in JetBrains Mono 10–11px (the portfolio's chart-caption voice); tooltips = paper-2 bg, 1px rule border, 6px radius, mono values. Chart components re-read the theme via `useTheme` and remount on change (`key={theme}` at the ChartReveal level — cheap, and the 900ms entrance animation doubles as the transition).

**8. Map — src/components/InteractiveMap.tsx.** Basemap per theme: light stays `positron`, dark uses `https://tiles.openfreemap.org/styles/dark` (verified live). Theme change remounts the map keyed on theme, preserving viewport + selected station through existing state/refs; `MOBI_BLUE`/`INK` constants become theme-derived accent/ink. Station-popup CSS in src/index.css already reads CSS vars so it themes for free; verify attribution legibility on dark.

**9. Accent discipline.** Mobi blue `#008fd3` is fully retired (grep the repo). The new accent appears only where the portfolio would use it: links, focus ring, chart data marks, map station dots, selected/active states. Buttons, headers, and chrome stay ink-and-paper.

## Non-goals

No copy edits, no section restructuring, no scrollspy/nav behavior changes, no chart/data changes, no removal of the a11y and iOS-canvas work from specs 032–037.

## Verification

- Full suite green after the re-skin: 90 Vitest tests (20 files), `tsc --noEmit`, and production build all pass. No test asserted on classes, so none needed updating.
- Cross-engine Playwright sweep against the production build (`vite preview`): chromium, webkit, and firefox at 320/360/375/390/414/768/1024/1440, light and dark — 48 combinations, 0 failures. Each pass asserted zero horizontal overflow, correct theme class from `prefers-color-scheme` on a first visit, both variable fonts active (`document.fonts.check`), charts mounted while their section is in view (the spec-037 windowing unmounts them once scrolled clear — expected), the MapLibre canvas present, and no console or page errors. The 320px column also ran under `prefers-reduced-motion: reduce`.
- Interactive checks via the Playwright browser: mobile hamburger menu (dark), Radix select dropdown open + option selection in the forecast section (March at 22°C correctly shows the out-of-range guard), flows and footer screenshot-reviewed in dark at desktop width.
- Theme toggle: flips instantly, persists across reload (the pre-hydration script applied `dark` before first paint on a stored-dark hard reload), charts remount with the dark palette, and the basemap swaps to OpenFreeMap `dark`. Scroll position measured identical before/after a toggle at the map section.
- Map chrome in dark needed three specificity bumps in src/index.css: maplibre's lazy-loaded stylesheet ties `.dark .maplibregl-ctrl-attrib` on the compact attribution pill (`.maplibregl-compact`, `.maplibregl-compact-show`, and the base `.maplibregl-ctrl.maplibregl-ctrl-attrib` variants), confirmed fixed by computed-style checks. Zoom controls and icons theme via `bg: --card` + `filter: invert(1)`.
- Contrast spot-checks: `#636a6f` on `#f7f9fb` ≈ 5.4:1 and `#959595` on `#0b0b0b` ≈ 7.4:1 (AA for the 11px eyebrows); accent link `#196ea9` on paper ≈ 4.9:1, `#5fa5de` on `#0b0b0b` ≈ 7:1.
- Reduced-motion handling is unchanged (reveals, pulses, smooth scroll all still gated).
- Font payload at runtime: latin variable woff2 only — Inter Tight 44.9 KB + JetBrains Mono 40.4 KB ≈ 85 KB, under the ~160 KB budget (other subsets load only via unicode-range if needed).
- Remaining for the owner: on-device pass in both themes, side by side with adnanreza.com, before deploy.

## Lifecycle

Branch `feat/038-portfolio-design-language` → implement in the order above (tokens → fonts → plumbing → components → charts → map) → verify → merge to main → deploy to CF Pages → owner checks the custom domain in light and dark.
