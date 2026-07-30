# 047 — Audit gap sweep across specs 038–046

## Context

An owner-requested audit of the last nine specs (2026-07-30) found the work
sound overall — every suite green, the freshness gate passing, spec 046
exemplary — but surfaced one latent crash, two already-wrong published
numbers, and a pattern: spec 045 (air quality) received one review round
where 046 received four, and most integrity gaps clustered in 045. This spec
closes everything the audit raised.

## Findings and fixes

**1. `pipeline/inventory.py` crashed on the ICBC manifest entry (latent, would
have hit the August run).** The reference renderer assumed every entry with a
`file` key also carries `bytes` and `fetched_at`; `icbc_crashes` carries
`rows` and `accessed_at` instead (`KeyError: 'bytes'`, reproduced against the
live manifest). Spec 039 fixed the mirror-image bug; 046 reintroduced the
class from the other side. The renderer now emits whatever scalar facts an
entry has, non-file entries no longer dump nested year/licence dicts, and
`test_inventory.py` covers all three real manifest shapes — it previously
only ever passed `reference: {}`.

**2. The published data-quality report was already wrong.**
`quality_report.py` hand-wrote "31 distinct header layouts across 102 files"
inside a generator whose docstring promises every number is queried; the
warehouse held 103. The gate byte-compares wrong-against-wrong, so it passed.
Extract now records `header_layouts` in `etl_metrics` (only extract sees raw
headers), the report quotes it, and `meta.json` publishes it so the
Methodology page derives its copy too. The era map's own `_comment` is now
count-free. Also fixed here: the unmapped-labels query had no `ORDER BY`,
and its verbatim list is byte-compared by the gate — the 045 diff shows it
actually reordering. Deterministic now, with the fixture test pinning
"1 distinct header layouts across 1 files".

**3. Station-count drift.** README said 262 active stations; the artifact
says 261, and `git show` proves 261 was already true when spec 041's doc
wrote 262 (corrected in place, per the 046 Review-3 precedent). The
`StationFinder` comment no longer carries a count at all. (Correction, same
day: a post-merge sweep of the public surfaces caught one more — "growth
from 547k to 1.23M annual trips" presented the 2023 peak as the present;
2024 and 2025 came in at 1.19M and 1.10M. Now phrased as a peak.)

**4. Air quality brought up to the 046 integrity standard.**

- **Publish-time manifest cross-check**: `v_pm25_daily` globs
  `airquality/pm25-*.csv`, so a truncated year or stray file silently moved
  `smokeDayCount`. `publish.py` now verifies every manifest year file exists
  and matches its sha256, and that the on-disk file set equals the manifest
  set, before reading a single row — mirroring the ICBC block.
- **Licence in the artifact**: `airquality.json` now carries the OGL-BC
  licence block and catalogue-record source, written by
  `airquality_fetch.py` through the manifest exactly as `icbc_fetch.py`
  does. Attribution verified character-by-character against the licence
  page (en dash in the statement, hyphen in the title, version 2.0) and
  pinned as a literal in both pytest and Vitest. BC ENV joined the README
  credits and the footer link now derives from the artifact.
- **Methodology derives instead of hand-writing**: "since 2017",
  "25 ug/m3", "verified through 2024", and "2025-onward holdout" were prose
  literals while the artifact published every one of them. All four now
  interpolate (`coverage.firstDay`, `smokeThresholdUgM3`, `verifiedThrough`,
  `forecast.modelCard.testRange`), the attribution renders verbatim, and
  Methodology tests cover the section — which the heading test had simply
  omitted.

**5. The spec 043 crash class got a real regression test.** The map is
stubbed under Vitest, so the theme-flip race was unreachable by the suite;
playwright sat unused in devDependencies with no config. Added
`playwright.config.ts` + `e2e/theme-flip.spec.ts` (`npm run test:e2e`
against the production build): wait for the style to actually load (the
attribution text, not the canvas, which exists pre-style), then triple-flip
inside the style-load window. **Proven by mutation**: disabling the guard →
boundary fallback plus dead canvas, 1 failed; restoring → 1 passed. Two
lessons the first draft of the test taught: a `toHaveCount` without `await`
asserts nothing, and flips before the first style finishes loading test
nothing because `loaded` is still false. The paint guard's three layer names
also moved into a `PAINTED_LAYERS` constant with a `paintedLayersReady`
helper, so a fourth painted layer cannot dodge the guard. And the checklist
claim in 043's doc ("lesson added to the map verification checklist") is now
actually true — `docs/review-checklist.md` carries the theme-flip item.

**6. Window-span prose derived.** "Nine and a half years" / "nine years"
appeared hand-written in seven places (App hero, nav label, two section
descriptions, footer, Methodology intro and drift heading, plus the quality
report's generator) beside derived `windowLabel`s, all quietly wrong from
January 2027. Both sides now derive: `spanPhrase()` in `src/data/index.ts`
(unit-tested on fixed inputs) with `sourceSpanLabel` /
`sourceSpanYearsLabel` / `sourceSpanYearsTitle`, and the same helper in
`quality_report.py`. The e-bike chapter's "nine years happened to e-bikes in
three" stays hand-written deliberately: it narrates a completed historical
comparison, not the window.

**7. Smaller fixes.** `StationDetailPanel` no longer renders a bare
`medianStationCrashes` that would print "reports )" on null. The Vitest
no-rate regex scanned only `byStation`, whose two fixed keys meant it could
never fail — it now scans the whole artifact with the pytest gate's pattern.
The smoke chart skips rendering (not just the caption) when the window is
empty. The theme-flip load handler re-seeds the selection ring from a ref,
so a selection made during the style load no longer paints the pre-flip
station. `airquality_fetch.download()` no longer leaks its temp file when
the request itself fails; `normalize()` lost a dead `verified` parameter.
`icbc_fetch` vintage mismatch is a `SystemExit` like every operator-facing
stop in `publish.py`, and its `HyperProcess` gets `log_config: ""` so 749 KB
of `hyperd.log` stops landing in the repo root (the existing one deleted).
`check_freshness.py`'s docstring said "10 publish JSONs" (there are 12);
it now describes the glob instead of a count.

**8. Process debris.** 045's and 046's Lifecycle sections claimed the work
was unmerged when both were on main and deployed — corrected. 040's doc says
where the fourth ask came from. `docs/roadmap-v2.md` gained a "Shipped since"
index for 032–047; nothing indexed anything past 031. The nine stale local
feature branches (`feat/038` … `feat/046`) that the lifecycle's COMPLETE step
should have deleted are removed with this spec's own merge. The README
runbook gained the step the audit showed was missing: the README itself does
not derive, so sweep it for artifact-mirroring counts each month.

## Audited and left alone

- `Explorer.test.tsx`'s `MAP_WAIT` was flagged as redundant with the global
  30 s Vitest timeout; it is not — it is a testing-library `findBy` timeout
  (1 s default), which `testTimeout` does not touch.
- The contract floor `lastMonth >= "2026-06"` passes forever by design; it is
  a floor, not a freshness check. Freshness is the gate's job.
- No automation notices a new Mobi month; the runbook stays manual and
  documented. A cron would need somewhere to run; the pipeline is local by
  design.
- The `sept2020` chart window stays pinned to the September 2020 event; a
  future worse event is a story-content decision, not a data bug.

## Verification (final)

- 59 pytest (3 new: reference shapes, span phrase, OGL-BC licence pin; the
  derived-counts assertion folded into an existing fixture test), 109 Vitest
  (2 new: OGL-BC attribution + derived air-quality facts, span-phrase units;
  the whole-blob no-rate regex replaced the tautological one in place),
  `tsc --noEmit`, production build.
- `make check-artifacts` PASS after regenerating `meta.json` (adds
  `headerLayouts`), `airquality.json` (adds `source` + `licence`), and
  `docs/data-quality-report.md` (derived counts, deterministic label order)
  from the rebuilt warehouse.
- Payload: 388.1 KB raw / 84.2 KB gzip against the 420/120 budget
  (licence block and `headerLayouts` cost ~0.4 KB).
- `npm run test:e2e` 1 passed against the production build; mutation run
  recorded above.
- OGL-BC attribution, title, and version verified against the licence page
  character by character before pinning.

## Lifecycle

Implemented on `fix/047-audit-gap-sweep` from the 2026-07-30 audit findings,
all of which the owner asked to be fixed ("take all of these"). Merged to
main, pushed, deployed 2026-07-30.
