# Feature 022 - Visual Redesign: Quiet, Editorial, Apple-Esque

Branch: `feature/visual-redesign`

## Goal

Replace the generic dashboard look with a quiet, editorial visual system in the spirit of Apple product pages: huge confident type, generous whitespace, content directly on the page, one accent color, and data visuals that feel designed rather than defaulted. After this spec, no screen should read as "AI-generated shadcn template."

## Explicitly Banned (current tropes to remove everywhere)

- Eyebrow pill badges above headings ("Vancouver mobility portfolio", "Live foundation", "Interactive filters", "Ranked insights", "Station profile", etc.).
- Gradient hero cards and the "Product foundation" self-referential status card.
- Uniform bordered white cards as the container for every piece of content.
- Tinted icon squares next to headings; decorative lucide icons in general (functional icons in controls may stay).
- Copy that narrates the app's own architecture ("MVP shell", "Front-end", "Geo upgrade", "feature status").
- Multi-hue default Chart.js colors (purple/green/blue mix).

## Design System

- **Typography is the design.** System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Inter, sans-serif`); drop the Google Fonts request. Display numerals at `text-6xl`-`text-8xl`, font-weight 600-700, `tracking-tight`, `tabular-nums`. Body `text-lg leading-relaxed` max-width ~65ch. A muted small-caps-free label style (plain `text-sm text-muted-foreground`) replaces every pill.
- **Color:** near-monochrome ink scale on white. Keep Mobi blue as the only accent, used sparingly: key numbers, the selected state, chart emphasis. Charts otherwise use a 3-step gray ramp. Delete accent-tinted backgrounds except one pale blue reserved for map water.
- **Surfaces:** content sits on the background. Hairline rules (`border-t border-border`) separate sections. Cards survive only where a true boundary is needed (map frame, station detail); when used: no shadow, 12px radius, hairline border.
- **Layout rhythm:** Apple-page cadence - full-width statement (huge headline or number), then supporting visual, then detail. Section spacing doubles (`py-24`+). Nav shrinks to wordmark + 4 text links, no backdrop-blur chrome.
- **Motion:** at most a subtle fade/translate on section entry, CSS-only, honoring `prefers-reduced-motion`. Nothing else animates.

## Chart Theme

- One shared Chart.js theme module (`chartTheme.ts` registered once): no legends where a caption sentence works, no grid verticals, hairline horizontal grid, unlabeled axes where the caption carries units, gray series with blue emphasis series, rounded bars, 1.5px lines, tooltips restyled to match (dark ink on white, hairline border).
- Every chart gets a one-sentence human caption stating the takeaway ("Summer carries three times the trips of December"), not a title label.

## Files

- `src/index.css`, `tailwind.config.ts` (token overhaul)
- `src/components/AppShell.tsx`, `PageSection.tsx`, `SectionHeader.tsx` (rebuilt; delete `FeatureStatusBadge.tsx`)
- `src/components/ui/*` (restyle variants; keep Radix/shadcn primitives as the behavioral base per the lifecycle)
- `src/components/charts/chartTheme.ts` (new; replaces per-chart color choices)
- Every existing section component gets a restyle pass (hero, overview, charts, filters, opportunity table, methodology)
- Update component tests that assert removed elements

## Copy Rules (structural pass only; full voice rewrite is spec 025)

- Headline speaks about the city, not the product: e.g. "Nine years of Vancouver by bike share." with a stat subline from `meta.json` (total trips, total km).
- Remove all build-status narration. Buttons say what they do ("See the map", "How the data works").

## Tests

Run:

```bash
npm run test && npm run typecheck && npm run build
```

Update unit tests for rebuilt shell/sections. Browser review at 375px, 768px, 1440px: no pill badges or icon tiles anywhere; hero renders with display numerals; charts follow the theme; contrast passes WCAG AA for text and interactive elements; no console errors; Lighthouse quick pass shows no font-loading regression (system stack = zero webfont bytes).

## Acceptance Criteria

- Zero instances of the banned tropes remain (grep-verifiable: no `FeatureStatusBadge`, no eyebrow badge classes).
- One accent color across app and charts; typography scale as specified.
- The page is recognizably distinct from a default shadcn dashboard in a side-by-side.
- Accessibility: AA contrast, visible focus states, reduced-motion respected.
- Vitest, typecheck, and build pass.
