# Spec 037 — Skeleton loaders + the real fix for blank charts on iOS Safari

## Context

Two linked owner reports. (1) Charts render blank on a real iPhone (Safari) —
reported twice; the previous mount-timing fix (spec: threshold 0 + rootMargin,
in `fix/mobile-charts`) did **not** resolve it on-device. (2) On a slow
connection the owner wants skeleton loaders for graphs / maps / tables.

Both are solved by the same architecture, so they ship together.

## Root cause (why the earlier fix missed)

The earlier fix assumed a *mount-timing* problem. It wasn't. Measured on an
emulated dpr-3 iPhone (WebKit): all 11 canvases mount at the correct size, and
the whole page's canvas backing store is only ~19–35 MB — far under iOS
Safari's canvas-memory ceiling. So neither "never mounts" nor "too much memory"
is the cause.

The actual behaviour — renders fine, then blanks on a real device but never in
emulation — is iOS Safari's **backing-store purge**: Safari silently discards
the pixels of an off-screen `<canvas>` to reclaim memory (on scroll, memory
pressure, or once the WebGL map initialises), and Chart.js has no event telling
it to repaint, so the canvas returns **blank**. Emulation runs on the Mac GPU,
which never purges — hence unreproducible in Playwright.

## The fix — windowed canvases + skeletons

- **`useViewportWindow` hook** (`src/hooks/useViewportWindow.ts`): reports
  viewport proximity that toggles *both ways* (unlike the one-shot
  `useScrollReveal`, which stays on). Generous rootMargin (600px) mounts a
  chart just before it scrolls in and unmounts it once it's well clear.
- **`ChartReveal` rewrite**: mounts the chart only while near the viewport,
  unmounts it otherwise, showing a `ChartSkeleton` in its place. A **fresh
  canvas is created every time the chart re-enters view**, so a purged backing
  store is never displayed — the purge is defeated by construction. As a
  bonus, only the on-screen charts are live (~1–4 canvases at a time, verified),
  so total canvas memory is bounded regardless of page length.
- **Skeletons** (`src/components/Skeletons.tsx`) in ghost-structure style, built
  on the shadcn `Skeleton` primitive (`src/components/ui/skeleton.tsx`):
  - `ChartSkeleton` — soft columns on a hairline baseline + axis-label ghosts.
  - `MapSkeleton` — faint street grid + a pulsing centre pin.
  - `TableSkeleton` — ghost rows (desktop) / ghost cards (mobile).
  - All `aria-hidden`; the pulse is disabled under `prefers-reduced-motion`.
- **Map**: `Explorer` Suspense fallback → `MapSkeleton`; `InteractiveMap`
  overlays `MapSkeleton` until MapLibre's first paint, and caps the map's
  `pixelRatio` at 2 (its 3× WebGL canvas is the single largest surface).
- **Charts**: `chartTheme` caps `ChartJS.defaults.devicePixelRatio` at 2
  (memory hygiene; ~56% smaller backing store on dpr-3 phones).
- **Table**: `OpportunityTable` shows `TableSkeleton` until scrolled near
  (one-shot), matching the charts on a slow first load.

## Verification

- `npm run typecheck`, `npm run test` (76 tests: +`Skeletons.test.tsx`,
  +`useViewportWindow.test.tsx`), `npm run build` — all green.
- Cross-engine Playwright (chromium / webkit / firefox), emulated dpr-3 mobile:
  skeletons render before mount; charts mount when scrolled in and **unmount
  when scrolled far away** (windowing confirmed); chart *and* map canvas DPR
  ≤ 2; **zero horizontal overflow** at 320/360/375/390/414/768/1024/1440 on
  fresh per-width loads in all three engines. (A transient +12px at 320px seen
  only when resizing an already-loaded map mid-sweep was confirmed to be a
  measurement artifact, not a real-user overflow.)
- Visual check: the previously-blank growth chart renders correctly under
  CPU throttle; `MapSkeleton` and `ChartSkeleton` reviewed on-device-size.
- On-device confirmation on the owner's iPhone is still required (the purge is
  not reproducible via automation).

## Lifecycle

Branch `feature/skeleton-loaders` → commit → merge to `main` → push → build →
`wrangler pages deploy dist` → owner verifies on their iPhone.
