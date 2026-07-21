import {
  lastCompleteYear,
  meta,
  stationsArtifact,
  transitCoverage,
  yearly,
} from "@/data";

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

const unmetTransit = transitCoverage.filter((t) => t.nearestDockM > 1000);

const REQUESTS = [
  {
    num: "01",
    title: "Bring the network south",
    body:
      "The map above ends at 30th & Ontario on the east side and East Blvd & 37th " +
      "on the west. I know those two docks well because my rides keep pointing " +
      "past them: to Langara College, where I teach, nineteen blocks beyond the " +
      "last dock, and on into South Vancouver. I live well inside the network, " +
      "near 10th & Granville. It's the destination end of the ride that falls " +
      "off the map.",
    note: `Southernmost docks today: ${southernmost.join(" · ")}`,
  },
  {
    num: "02",
    title: "Send e-bikes with it",
    body:
      "The ride to work is the problem: from 10th & Granville it's up and over " +
      "the city's central ridge to 49th, and nobody wants to open a day of " +
      "lectures sweaty. Coming home is the easy direction. It's the morning " +
      "climb that decides whether the bike gets used, and it's exactly what " +
      "a battery erases. If the network comes south, it should come with e-bikes.",
    note: `${ebikePct}% of ${currentYear} trips are electric`,
  },
  {
    num: "03",
    title: "Price e-bikes for commuters",
    body:
      "My corporate annual pass includes classic rides up to 60 minutes, but " +
      "e-bikes still bill by the minute on top of it. A general e-bike pass, or a " +
      "corporate e-bike tier like UBC's, would let regulars pay for the battery " +
      "once instead of every ride.",
    note: `Corporate passes carried ${corporatePct}% of ${lastCompleteYear} trips`,
  },
  {
    num: "04",
    title: "Meet the train everywhere",
    body:
      "The out-there one: a dock at every SkyTrain station in Vancouver proper. " +
      "Today the split is stark: a station either has a dock within about 200 m " +
      "of the fare gates or none within a kilometre. Nanaimo, 29th Avenue, " +
      "Joyce–Collingwood, Renfrew, Rupert, and the Canada Line's whole southern " +
      "leg are transfers Mobi never meets. The Coverage view on the map above " +
      "draws the gap.",
    note: `${unmetTransit.length} of ${transitCoverage.length} rapid-transit stations lack a dock within 1 km`,
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
        Unlike the signals above, these aren't rules over the data. They're one
        rider's asks. Mine.
      </p>
    </div>
  );
}
