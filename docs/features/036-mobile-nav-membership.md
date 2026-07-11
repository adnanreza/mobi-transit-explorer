# Feature 036 - Hamburger Nav, Zero Horizontal Scroll, Membership Story

Branch: `feature/mobile-nav-membership`

## Goal

Replace the mobile nav's rejected horizontal-scroll strip with a hamburger menu,
guarantee zero horizontal scrolling in every browser, and add a data-tied
personal membership story.

## Changes

- **Hamburger mobile nav (`src/components/AppShell.tsx`):** below `md`, a menu
  button toggles a full-width dropdown listing all 7 sections (stacked, 44px+ tap
  targets, `aria-expanded`/`aria-controls`, active `aria-current`). Closes on link
  click, Escape, outside tap, and on growing to `md+`. The `md+` inline nav is
  unchanged. Removed the old `overflow-x-auto` strip and the `.no-scrollbar`
  utility from `src/index.css`.
- **Zero horizontal overflow, all browsers:** a cross-browser Playwright sweep
  (chromium + firefox + webkit at 320/360/375/390/414/768/1024/1440) found
  overflow that Chromium alone hid — the RealMobiCharts canvases and the flows
  ranked lists at ≤375px, caused by the grid/flex `min-width: auto` trap plus
  Chart.js's 300px default. Fixed by adding `min-w-0` (and `w-full` on
  `ChartReveal`) down the chart/flows shrink chain. Re-sweep: 24/24 clear.
- **"Who rides" membership chapter (story chapter 7):** derived entirely from the
  existing `yearly.json` `membershipMix` (no pipeline change). Headline "One ride
  in 5 is now on a corporate pass"; a share-over-time line chart (Corporate
  highlighted, others in the gray ramp, legend shown); caption in the author's
  voice tying his pass arc — day passes near UBC, an annual in East Van, a Langara
  corporate pass now, and Mobi as the last mile of a SkyTrain trip from Burnaby —
  to the real trend (Corporate 4%→22% by 2025; casual held flat, stated honestly).
  Verified against `v_yearly_membership`.

## Verification

72 Vitest + 35 pytest + typecheck + build pass; cross-browser sweep = 0 overflow;
MCP check of the hamburger (open/navigate/close/Escape/active) and the membership
chapter/chart; deploy.
