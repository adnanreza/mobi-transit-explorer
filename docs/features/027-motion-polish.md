# Feature 027 - Motion Polish

Branch: `feature/motion-polish`

## Goal

Add subtle, Apple-product-page-style motion so the experience stands out
without ever getting in the way of the data: a staggered hero entrance,
cascading section reveals, stat numerals that count up, charts that draw
themselves as they arrive, a scrollspy nav, and quiet icons on the hero CTAs.

## Decisions

- **No scrolljacking, no parallax, no pinned sections** — they fight a
  data-dense page and hurt accessibility. The Apple feel comes from timing,
  not hijacked scroll.
- **No new dependencies.** CSS transitions/keyframes + IntersectionObserver +
  requestAnimationFrame only; framer-motion was considered and rejected
  (~30 KB for an idiom this quiet design doesn't need).
- Transform/opacity only; every scroll trigger fires once (unobserve after).
- Two duration tiers only: ~150 ms hovers, 700 ms reveals (charts 900 ms).
- **Reduced-motion matrix** (every mechanism has a path):
  hero uses `motion-safe:` so it renders static; `useScrollReveal` early-exits
  to visible; `.reveal-stagger` has a reduce-media override; `useCountUp`
  renders the final value instantly; Chart.js global animation is disabled;
  icon nudges are `motion-reduce:`-guarded. Scrollspy is state tracking, not
  motion, so it stays on.
- Test-mode facts honored: the jsdom IntersectionObserver mock never fires, so
  `ChartReveal` treats `MODE === "test"` as visible and `useCountUp`
  initializes display state to the final string.
- CTA icons: lucide `Bike` on "See the map", `Database` on "How the data
  works" (owner's choice), 16 px, nudging 2 px on hover.

## Files

- `tailwind.config.ts` — `fade-up` keyframes/animation (`both` fill enables
  the CSS-only stagger)
- `src/App.tsx` — hero entrance stagger + CTA icons
- `src/hooks/useScrollReveal.ts` — generic element type
- `src/components/Reveal.tsx` — `as` / `stagger` / `staggerStep` props
- `src/index.css` — `.reveal-stagger` cascade (delay caps at child 7)
- `src/components/charts/ChartReveal.tsx` (new) — mount charts in view
- `src/components/charts/chartTheme.ts` — 900 ms easeOutQuart default,
  off under reduced motion
- `src/hooks/useCountUp.ts` + `useCountUp.test.ts` (new) — formatted-string
  count-up (parses "8,077,430", "23.2M km", "262", "42%", passes "—" through)
- `src/components/OverviewCards.tsx` — stagger + `CountUpValue`
- `src/components/Methodology.tsx`, `src/components/RealMobiCharts.tsx`,
  `src/components/story/StorySection.tsx` — stagger / ChartReveal applied
- `src/components/AppShell.tsx` — scrollspy with post-click suppression

## Verification

- `npm run test`, `npm run typecheck`, `npm run build` (bundle delta ≈ 0,
  package.json untouched), pytest unaffected.
- Browser: hero staggers on hard reload; reveals fire once; stats count up
  ~1 s; story charts draw on arrival; scrollspy tracks all five sections and
  holds steady through a nav click; icons nudge on hover; 375 px pass.
- Reduced-motion emulation: everything static and fully visible, stats final
  instantly, charts pre-drawn, no nudges.
