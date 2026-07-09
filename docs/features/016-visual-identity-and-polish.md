# Feature 016 - Visual Identity and Polish

Branch: `feature/visual-identity-and-polish`

Note: Feature 017 supersedes the sparkline implementation from this spec. The current app uses Chart.js canvas charts and no longer depends on `react-tiny-sparkline`.

## Goal

Upgrade the app's visual identity, layout rhythm, data density, motion, and map polish to create a distinctive, portfolio-quality product feel.

## Scope

Revise the design system (colors, typography, card treatments), add scroll-reveal animations, introduce lightweight sparkline charts, and polish the mock map. Uses only the existing stack: Tailwind CSS, shadcn/ui patterns, lucide-react. No new dependencies unless explicitly listed.

## Requirements

### 1. Color System Refresh

- Introduce a richer primary palette. The current blue (`199 100% 41%`) is functional but flat. Add a complementary accent color for secondary signals.
- Add subtle gradient overlays to hero sections and card headers (e.g. `bg-gradient-to-br from-primary/5 via-transparent`).
- Use oklch or keep HSL — whichever is cleaner with the existing CSS variable pattern.
- Ensure all background/foreground contrast ratios pass WCAG AA.

### 2. Typography

- Use Inter (400–700 weights) as the primary font. Add via a `<link>` in `index.html` or `@import` in CSS.
- Apply `tabular-nums` on all numeric displays (scores, trip counts, percentages).
- Establish a clearer type scale: display (`text-4xl`/`font-bold`), section-title (`text-2xl`/`font-semibold`), body (`text-base`), meta (`text-sm`), badge (`text-xs`).
- Keep fixed-size chips for labels/badges; let body text scale.

### 3. Card and Container Refresh

Current cards use `bg-white/90 shadow-sm` uniformly. Differentiate:
- **Data cards** (OverviewCards metrics): `bg-white shadow-sm border-t-2 border-primary/20` with a subtle gradient background.
- **Map card**: `bg-white/95 shadow-md` with highlighted header.
- **Methodology cards**: softer treatment — `bg-white/80 border-dashed`.
- All cards: standardize on `rounded-xl` instead of the default `rounded-lg`.

### 4. Motion and Animation

Add **scroll-triggered reveal animations** using a lightweight IntersectionObserver approach (no Framer Motion):

- Page sections (`#overview`, `#map`, `#opportunities`, `#methodology`) fade in and slide up as they enter the viewport.
- Cards within grids stagger in with incremental delays (50–100ms apart).
- The hero section can have a subtle entrance animation on initial load.

Implementation:
- Create `src/hooks/useScrollReveal.ts` — returns `{ ref, isVisible }`, unobserve after first reveal.
- Wrap sections in a `<Reveal>` component or apply the hook directly.
- Use Tailwind transitions: `transition-all duration-700 ease-out`.
- Respect `prefers-reduced-motion`. Wrap animations in a `motion-safe:` variant.

### 5. Data Density — Sparkline Charts

Add lightweight inline sparklines to the **OpportunityTable** reason column and the **StationDetailPanel** metrics.

Use `react-tiny-sparkline` (< 2KB gzipped, zero deps):

- **StationDetailPanel**: For the three metric blocks (monthly trips, trips near transit, e-bike share), add a small trend sparkline below the value. Use static sample trend data per station (added to the station data model).
- **OpportunityTable**: For the "reason" column, prepend a mini bar sparkline showing the connector score components for that station (transit proximity, trip volume, commute pattern, e-bike share, station connectivity — the 5 factors).

Because real trend data does not yet exist, add a `mockTrend` array of 7 numbers to each station in `src/data/stations.ts`.

### 6. Map Polish

Upgrade the mock CSS map:

- Smooth station dot transitions: `transition-all duration-300` on the station buttons.
- Richer geography: add a second water body (False Creek) with a different blue, and a park area (emerald shape) using a softer green.
- Station dot colors: add a subtle inner shadow or gradient to each dot for depth.
- Transit node icons: add a subtle pulse animation (`animate-pulse` on the dark square) to draw attention.
- Legend: increase contrast — use black text on white, add a subtle reorder.

### 7. Hero Section Polish

- Add a decorative background pattern behind the hero card (subtle grid dots or a diagonal mesh).
- Add a soft gradient border to the hero card.

## Data Changes

Add to `src/types/index.ts`:

```typescript
export type TrendData = number[];
```

Add a `trend` field to the `MobiStation` type:

```typescript
trend: TrendData;
```

Populate each station in `src/data/stations.ts` with a 7-point trend array (plausible monthly trip counts over a mock 7-month period).

Update `src/data/mockData.test.ts` to assert that `trend` is present and has exactly 7 entries.

## Dependencies

Add:

- `inter` Google Font via `index.html`
- `react-tiny-sparkline` via `npm install`

## Files to Create

- `src/hooks/useScrollReveal.ts`

## Files to Modify

- `src/index.css` — font import, animation keyframes, motion-safe variants
- `src/App.tsx` — add Reveal wrappers around sections
- `src/components/AppShell.tsx` — font class on `<main>`, subtle header refinements
- `src/components/OverviewCards.tsx` — updated card styles, gradient headers
- `src/components/StationDetailPanel.tsx` — add sparkline to each metric block
- `src/components/OpportunityTable.tsx` — add sparkline to reason column
- `src/components/MobilityMap.tsx` — smooth transitions, richer geography, node pulse
- `src/components/Methodology.tsx` — dashed card border
- `src/types/index.ts` — add `TrendData`
- `src/data/stations.ts` — add `trend` arrays
- `src/data/mockData.test.ts` — validate trend data

## Commands

- `npm install react-tiny-sparkline`
- `npm run build`
- `npm run test`
- `npm run typecheck`

## Acceptance Criteria

- App feels visually richer without being heavy.
- Cards have distinct visual hierarchy.
- Scroll reveal animations are smooth and respect reduced motion.
- Sparklines render correctly with sample data.
- Map has smoother interactions and richer geography.
- All existing tests pass, new trend data tests pass.
- No regressions in a11y or responsiveness.
