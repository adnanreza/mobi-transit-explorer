# Feature 023 - The Yearly Story: Nine Years of Riding

Branch: `feature/yearly-story`

## Goal

Add the signature section of the product: a scrolling, chapter-based narrative of how bike share in Vancouver changed from 2017 to today, told with the new visual language - one big claim per chapter, one full-bleed visual proving it. This is where "show yearly changes" lives, and it is the section most likely to be remembered by someone at Mobi.

## Scope

- New top-level section (`#story`, nav label "Nine years") between Overview and Map.
- Five data chapters built from spec 020 artifacts, each: display-scale headline stating the finding in plain language → full-width themed chart → 2-3 sentence caption with the numbers.
- Replace the Overview section's now-redundant chart grid with the trimmed version described below.

## Chapters (findings phrased from real data; verify exact numbers from artifacts at build time)

1. **Growth** - "From X trips to Y." Continuous monthly area/line, 2017 to present (`monthly.json`), year boundaries as hairline ticks, latest year in blue. Callout markers for system launch era and e-bike introduction (first month `is_ebike` appears).
2. **Seasons** - "Every year has the same shape." Twelve-month seasonality curves overlaid per year (`seasonality.json`), old years in light gray, current year in blue. Caption on the summer:winter ratio.
3. **The pandemic** - "2020 bent the curve; it didn't break it." Growth series with 2019-2021 emphasized; caption on the dip, the leisure shift, and the recovery year.
4. **E-bikes** - "The fastest change the network has seen." E-bike share of trips by month since introduction (`monthly.json`), plus adoption share in the latest year. Honest caveat if fleet composition explains part of the curve.
5. **Weather** - "Vancouver rides at 8 degrees." Trips by temperature band (`weather.json`); caption acknowledging temperature correlates with season and daylight - stated as association, not cause.

Each chapter's headline/caption copy lives in one data-driven module (`storyContent.ts`) that pulls its numbers from artifacts - no hardcoded figures that go stale on the next data refresh.

## Overview Trim

Overview becomes: one hero stat row (total trips, total km, years, stations - from `meta.json`) plus the two strongest at-a-glance charts. Charts that moved into story chapters are removed, not duplicated.

## Files

- `src/components/story/StorySection.tsx`, `StoryChapter.tsx`
- `src/components/story/charts/*.tsx` (one per chapter, on `chartTheme.ts`)
- `src/components/story/storyContent.ts`
- `src/components/OverviewCards.tsx`, `RealMobiCharts.tsx` (trim/refactor)
- Nav updates in `AppShell.tsx`
- `src/components/story/__tests__/`

## Behavior Rules

- Chapters reveal with the spec-022 fade only; charts render statically (no scroll-driven animation, no scrolljacking).
- Fully readable at 375px: charts reflow, headlines scale down, captions never truncate.
- Each chapter is an `<article>` with a proper heading; charts carry text alternatives summarizing the trend for screen readers.

## Tests

Run:

```bash
npm run test && npm run typecheck && npm run build
```

Unit: `storyContent.ts` derives every displayed number from artifact fixtures (change the fixture, the copy changes); chapters render with headline, chart, caption; nav includes the section. Browser review: chapter rhythm feels like a product page, not a dashboard; mobile reflow; no console errors.

## Acceptance Criteria

- Five chapters render with real multi-year numbers derived at build time from generated artifacts.
- The pandemic dip, seasonal shape, and e-bike ramp are each visible within two seconds of looking at their chapter.
- No number is hardcoded in JSX; a data refresh updates the story.
- Overview no longer duplicates story charts.
- Vitest, typecheck, and build pass.
