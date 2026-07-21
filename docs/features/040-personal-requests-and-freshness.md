# Spec 040 — Personal requests section + how-new-data-lands notes

## Context

Two owner asks. First, a "Personal requests" section: the rider's counterpart to Signals — the owner rides this network daily from 10th & Granville (well inside the network) but teaches at Langara College, which the network doesn't reach. Second, a note on both the site and the GitHub README explaining how the project absorbs new data, now that June 2026 (spec 039) proved the flow live. The freshness story is a differentiator for both audiences: it's the difference between a one-off analysis and an operated data product.

## Changes

**1. Personal requests section** (src/components/PersonalRequests.tsx, wired into src/App.tsx as `#requests` between Signals and Methodology; "Requests" added to the nav). Three asks in portfolio ruled-row style — numbered eyebrow, title + prose, right-aligned mono annotation:

- *Bring the network south* — no docks south of 30th & Ontario / East Blvd & 37th; the owner uses those two end-of-the-line docks constantly because his rides point past them, to Langara College (nineteen blocks beyond the last dock) and South Vancouver. (Corrected mid-review: he lives near 10th & Granville, inside the network — the gap is the destination end of the commute, not home.)
- *Send e-bikes with it* — the ride home from South Vancouver climbs the city's central ridge; the climb decides usage.
- *Price e-bikes for commuters* — corporate annual passes cover 60-minute classic rides but meter e-bikes by the minute; a general or corporate e-bike tier (UBC precedent) is the ask.

House discipline holds: every annotation derives from the artifacts, not copy — the two southernmost docks are computed from station coordinates (they are exactly the two the owner named), the e-bike share comes from `meta.totals.ebikeSharePctLatestYear` (41% of 2026), and the corporate share from the last complete year's `membershipMix` (22% of 2025). A closing line labels the section explicitly as one rider's asks, not rules over data — preserving the honesty that distinguishes Signals.

**2. "When a new month lands."** New Methodology section describing the monthly flow (manifest scrape → checksum pin → era-map-or-stop → regenerate → byte-compare gate) with June 2026 as the lived case study, linking to the repo. README.md gains a parallel "When a new month lands" section with the five-step runbook and the spec-039 case study, and its rotting hardcoded counts (102 files, exact row totals) are replaced with durable phrasing pointing at the regenerated data-quality report.

**3. Footer freshness line.** "Data through June 2026 · regenerated with each monthly Mobi release" — formatted from `meta.sourceWindow` via the spec-039 `asOfLabel`, so it can never go stale.

## Verification

- 93 Vitest tests pass (3 new: PersonalRequests renders the asks, annotations match derived-value patterns, the not-rules disclaimer is present; App tests extended for the new nav item, `#requests` target, and section heading). Typecheck + production build green.
- Nav fit with the eighth item measured at 768px (the tightest desktop-nav width): nav 583px, no header or page overflow.
- Visual check against the production build: section renders in both themes at 1440 and stacks correctly at 375 (number → title → prose → annotation) with zero horizontal overflow; footer shows the freshness line.
- Data claims verified against artifacts before writing copy: southernmost stations East Blvd & 37th (49.2382) and 30th & Ontario (49.2434); e-bike share 40.9%; Corporate 21.8% of 2025 trips.

## Lifecycle

Branch `feat/040-personal-requests` → implement → verify → merge to main → push → deploy to CF Pages → owner reads the section as the person it's written by.
