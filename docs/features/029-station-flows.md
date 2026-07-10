# Feature 029 - Station Flows and Implied Rebalancing

Branch: `feature/station-flows`

## Goal

Show the network's invisible daily labour: which stations drain and which
fill, hour by hour, and how many bikes crews must move to keep the system
usable. Verified against the warehouse before building: Cordova & Granville
gains ~+227 bikes/hour (T12 aggregate) at 8am on weekdays and sheds them from
5pm; network-wide, roughly 417 bikes a day must be redistributed by hand.
This is the most operationally relevant view the public data can support.

## Decisions

- **Implied, and said so.** Mobi excludes crew trips from the published data,
  so rebalancing burden is inferred from rider-created imbalance: the average
  daily sum of |station net flow| across stations, divided by two (each moved
  bike leaves one station and arrives at another). Methodology states this.
- Flows use station-resolved countable trips over the trailing 12 complete
  months; day type comes from each end's own timestamp (a Friday-night ride
  can depart on a weekday and return on a weekend day).
- Charts show **per-day averages** (dep/ret divided by the window's weekday or
  weekend-day count) — the 028 honesty rule; day counts ship in the artifact.
- Palette stays in-system: returns/filling = Mobi blue, departures/draining =
  ink/gray. No new hues.
- Rankings (top morning importers, evening exporters) derive in the app from
  the artifact, not as a second artifact.

## Files

- `pipeline/sql/50_publish.sql` — `v_station_flows`, `v_station_balance`,
  `v_network_rebalancing`
- `pipeline/publish.py` — `flows.json` artifact (ints only; stations limited
  to the active/coordinates set the app already knows)
- `pipeline/tests/test_publish.py` — hour-bucketing, reconciliation with
  countable trips, balance math on a crafted fixture
- `src/data/contracts.ts`, `src/data/index.ts`, `src/data/generated.test.ts`
- `src/components/flows/flowsContent.ts` (+ test) — pure derivations
- `src/components/flows/FlowsSection.tsx` (+ test) — headline, ranked lists,
  station flow explorer (StationFinder + day-type toggle + 24h chart)
- `src/App.tsx` nav/section, `src/App.test.tsx` arrays
- `src/components/Methodology.tsx` — implied-rebalancing paragraph

## Verification

pytest + Vitest + typecheck + build (size budgets hold); browser review:
flows section renders, headline plausible (~400/day), station chart matches
the 0021 signature, mobile pass, no console errors; lifecycle COMPLETE +
Cloudflare deploy.
