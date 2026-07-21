# Spec 039 — June 2026 data: the first live monthly update

## Context

June 2026 trip data appeared on Mobi's system-data page — the first new month since the pipeline was built, and the first real test of whether the wheel turns without rebuilding it. The short answer: yes. `scrape_manifest.py` detected the new period and its Drive ID on its own, the header layout matched the era map (no drift), and the whole chain — download, inventory, ETL, weather, publish, model refit, freshness gate — ran clean. The month added 127,756 trips (Mar 63k → Apr 87k → May 112k → Jun 128k, the expected seasonal ramp), bringing the archive to 8,294,910 trips through 2026-06.

The live test also surfaced four latent issues, all fixed here. That was the point of the test.

## Changes

**1. Data (the routine part).** pipeline/manifest.json gains `2026-06` (Drive ID auto-scraped, sha256/bytes recorded by download.py; 23.3 MB CSV). All artifacts in src/data/generated/ regenerate; docs/data-quality-report.md updates; forecast.json refits with the holdout extended to 2026-06-30 (test MAE 553, R² 0.753). `make check-artifacts` passes. One unlabeled duplicate anchor for the 2017 workbook on Mobi's page produces a scraper warning — harmless, noted for the next run.

**2. Window copy derives from meta.** Five spots hardcoded "2017–2026, as of May 2026" and would have gone stale every month. src/data/index.ts now exports `sourceYearRange`, `asOfLabel`, and `windowLabel`, formatted from `meta.sourceWindow`; the hero eyebrow (src/App.tsx), three section descriptions (src/App.tsx), and the archive sentence in src/components/Methodology.tsx interpolate them. Future months need zero copy edits. The contract test floor moves to `lastMonth >= "2026-06"`.

**3. Mobile blank-section fix (owner-reported, live site).** Whole sections could sit invisible at `opacity: 0` while occupying thousands of pixels — the owner hit it below the Signals cards on an iPhone. Root cause: `useScrollReveal` defaulted to `threshold: 0.15`, and a fractional IntersectionObserver threshold can never fire for an element taller than the viewport (intersectionRatio maxes out at viewport/element height — Methodology is 6,975px on a 667px viewport, capping the ratio at 0.096). src/hooks/useScrollReveal.ts now defaults to `threshold: 0` — any visible pixel reveals; the animation is a garnish, never a gate on content — and falls back to visible when IntersectionObserver is missing. Spec 038's larger reading type made sections taller and tipped desktop-marginal sections over the edge on phones; the sweep missed it because it asserted DOM presence, not reveal opacity.

**4. Boot skeleton for slow connections.** Until React mounts, the page was a blank body. index.html now ships a static pulsing skeleton inside `#root` (nav wordmark + ghost hero bars, pure inline CSS, theme-aware via the pre-paint dark script, honors reduced motion) that the React mount replaces. As a side effect `<html>` is painted in the theme's paper tone, killing the pre-CSS white flash on dark reloads.

**5. New-station edge case.** June introduced Callister Park - Fan Fest (station 0643, opened for FIFA, 362 trips) — the first station with no complete-year history. The contract test correctly failed on its empty trend array. `completeYearTrend` in src/data/index.ts now falls back to the partial current year, and src/components/StationDetailPanel.tsx renders the trend block only with ≥ 2 points (a one-point line chart draws nothing).

**6. Pipeline bug.** pipeline/inventory.py crashed with `KeyError: 'file'` on the `ec_weather` reference entry (station + years, no file) — a latent report-writer assumption first exercised now that the weather reference exists. It formats non-file references generically and the run exits 0.

## Verification

- Pipeline: `inventory.py` exit 0 (103 files, checksums verified, no gaps); `etl.py --stage all` clean with no `UnknownColumns`; `make check-artifacts` PASS; 36 pytest tests pass.
- Artifacts: `meta.sourceWindow.lastMonth = "2026-06"`; monthly series continuous; June trips plausible against the seasonal ramp; publish payload 76.2 KB gzip (budget 400 KB).
- Frontend: 90 Vitest tests (including the empty-trend failure, then fixed), `tsc --noEmit`, production build all green.
- Behavior at 375×667 against the production build: Methodology reveals to `opacity: 1` promptly after entering the viewport (previously stuck at 0); boot skeleton present in served HTML and gone after mount; hero shows 8,294,910; "as of June 2026" renders in all derived spots; Explorer scope label reads "Trailing 12 months to 2026-06"; `?station=0643` renders Callister Park with the trend block hidden and no console errors.
- Lesson recorded: future sweeps should assert computed opacity of reveal wrappers, not just DOM presence.

## Lifecycle

Branch `data/2026-06` → pipeline run → fixes above → verify → merge to main → push → deploy to CF Pages → owner re-checks the blank spot below Signals on the same phone, both themes.
