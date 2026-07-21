import { lastCompleteYear, meta, stationsArtifact, yearly } from "@/data";

// The rider's counterpart to the Signals section: three asks that are
// personal, not rule-derived — and labelled that way. The annotations still
// come from the data so the section can't drift out of date.

const southernmost = [...stationsArtifact.stations]
  .sort((a, b) => a.lat - b.lat)
  .slice(0, 2)
  .map((s) => s.name);

const lastCompleteMix = yearly.find((y) => y.year === lastCompleteYear)?.membershipMix ?? {};
const mixTotal = Object.values(lastCompleteMix).reduce((a, b) => a + b, 0) || 1;
const corporatePct = Math.round((100 * (lastCompleteMix["Corporate"] ?? 0)) / mixTotal);

const ebikePct = Math.round(meta.totals.ebikeSharePctLatestYear ?? 0);
const currentYear = meta.sourceWindow.lastMonth.slice(0, 4);

const REQUESTS = [
  {
    num: "01",
    title: "Bring the network south",
    body:
      "The map above ends at 30th & Ontario on the east side and East Blvd & 37th " +
      "on the west. South of that line there are no docks at all — not at Langara " +
      "College, where I teach, and not in the neighbourhoods below 41st, where I " +
      "live. The southern third of the city is blank on the map.",
    note: `Southernmost docks today: ${southernmost.join(" · ")}`,
  },
  {
    num: "02",
    title: "Send e-bikes with it",
    body:
      "Vancouver rises as it runs south. Riding downtown is a coast; riding home " +
      "is a climb, and after a full day's work that difference decides whether the " +
      "bike gets used at all. If the network comes south, it should come with " +
      "batteries.",
    note: `${ebikePct}% of ${currentYear} trips are electric`,
  },
  {
    num: "03",
    title: "Price e-bikes for commuters",
    body:
      "My corporate annual pass includes classic rides up to 60 minutes, but " +
      "e-bikes still bill by the minute on top of it. A general e-bike pass — or a " +
      "corporate e-bike tier like UBC's — would let regulars pay for the battery " +
      "once instead of every ride.",
    note: `Corporate passes carried ${corporatePct}% of ${lastCompleteYear} trips`,
  },
];

export function PersonalRequests() {
  return (
    <div>
      <ol>
        {REQUESTS.map((request) => (
          <li
            key={request.num}
            className="grid gap-x-8 gap-y-3 border-t border-border py-8 md:grid-cols-[56px_minmax(0,1fr)_220px]"
          >
            <p className="eyebrow" aria-hidden="true">
              {request.num}
            </p>
            <div>
              <h3 className="text-xl font-medium tracking-tight text-foreground">
                {request.title}
              </h3>
              <p className="mt-2 max-w-xl text-base leading-7 text-muted-foreground">
                {request.body}
              </p>
            </div>
            <p className="font-mono text-xs leading-5 text-muted-foreground md:text-right">
              {request.note}
            </p>
          </li>
        ))}
      </ol>
      <p className="border-t border-border pt-6 text-sm text-muted-foreground">
        Unlike the signals above, these aren't rules over the data — they're one
        rider's asks, from the bottom edge of the map.
      </p>
    </div>
  );
}
