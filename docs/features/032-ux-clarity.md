# Feature 032 - UX Clarity Fixes (owner feedback)

Branch: `feature/ux-clarity`

## Goal

Four confusions reported by the owner, fixed:

1. **Flows chart "doesn't change" on station select.** Verified it does update
   (values, axis, caption), but nothing announces it — and commuter stations
   share near-identical curves. Fix: the selected station's name becomes the
   chart's title line, and the chart remounts on selection so the draw
   animation replays, making the change visible.
2. **Unlabeled evidence mini-chart in Opportunities.** The five-bar connector
   component sparkline had no labels and no way to earn them at that size.
   Removed — the evidence sentence already cites the numbers.
3. **Nav completeness.** The forecaster widget was buried at the end of the
   story section with no anchor. It becomes its own `#forecast` section
   ("Forecast") in the nav, like Flows/Map/Opportunities.
4. **Map colour modes unexplained.** A dynamic caption under the toggle now
   says what the blue intensity encodes in the current mode and links to the
   methodology definition (connector score weights / leisure heuristic).

## Files

- `src/components/flows/FlowsSection.tsx` — station-name chart title + keyed
  remount
- `src/components/OpportunityTable.tsx` — remove the unlabeled sparkline
- `src/App.tsx` / `src/App.test.tsx` — `#forecast` section + nav
- `src/components/story/WeatherModelBlock.tsx` — reshaped as a section body
- `src/components/Explorer.tsx` — colour-mode caption with methodology link

## Verification

Vitest + typecheck + build; browser: switching stations visibly redraws and
retitles the flows chart; opportunities table reads cleanly; Forecast in nav
and scrollspy; map caption switches with the toggle; lifecycle + deploy.
