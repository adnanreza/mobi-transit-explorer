import { PipelineDiagram } from "@/components/PipelineDiagram";
import { Reveal } from "@/components/Reveal";
import { meta } from "@/data";

const formatNumber = (value: number) => value.toLocaleString("en-CA");

const REPORT_URL =
  "https://github.com/adnanreza/mobi-transit-explorer/blob/main/docs/data-quality-report.md";
const REPO_URL = "https://github.com/adnanreza/mobi-transit-explorer";

export function Methodology() {
  return (
    <Reveal stagger className="max-w-3xl space-y-14">
      <p className="text-lg leading-8 text-foreground">
        I moved to Vancouver in August 2015 and have never owned a car here —
        transit, bike share, and walking, with zero regrets and some fun along
        the way. Mobi arrived the summer after I did, so its entire public
        record overlaps my own years moving through this city. That's why nine
        years of trip files aren't an abstract dataset to me, and why this
        section is the honest account of how they become the numbers above.
      </p>

      <Section title="The data">
        <p>
          Mobi by Rogers publishes a trip file for every month of operation:
          one workbook covering 2017, then monthly files from January 2018
          onward — {meta.quality.filesProcessed} files under the Mobi Data
          License Agreement. Timestamps are rounded to the nearest hour for
          rider privacy, accounts are anonymized, and Mobi's own rebalancing
          trips are removed before publication. I add two open sources:
          Mobi's GBFS feed for live station coordinates and capacity, and City
          of Vancouver Open Data for rapid-transit locations and the shoreline
          (Open Government Licence – Vancouver).
        </p>
      </Section>

      <Section title="The pipeline">
        <p className="mb-6">
          A staged Python + DuckDB pipeline runs locally — the site you're
          reading is static files. Each stage is re-runnable and counts its
          rows in and out:
        </p>
        <PipelineDiagram />
      </Section>

      <Section title="Nine and a half years of drift">
        <p>
          The archive is nine and a half years (2017–2026, as of May 2026) of quiet format entropy, and handling it is
          most of the work. Across {meta.quality.filesProcessed} files there
          are 31 distinct column layouts — the membership column alone appears
          as <Code>Membership type</Code>, <Code>Membership Type</Code>,{" "}
          <Code>Formula</Code>, and the typo <Code>Memebership type</Code>.
          Timestamps come in five shapes, from Excel serial numbers to April
          2019's <Code>4/20/19 16:06</Code>. Three 2020 files use classic-Mac
          line endings; three 2023 files corrupt the Squamish-language station
          name šxʷƛ̓ənəq Xwtl'e7énḵ Square into invalid UTF-8. The trip files'
          temperature column comes from a bike-mounted sensor that reads high in
          sun, emits 0° sentinels, and reports values Vancouver has never seen
          (up to 45°C), so it is not used for weather — the weather chapter uses
          Environment Canada ambient readings instead. In May and June
          2025 station names lost their numeric IDs entirely (resolved through
          a name-to-ID crosswalk built from the prefixed months and the GBFS
          feed) while most membership labels went blank (kept and reported as
          Unknown — {formatNumber(meta.quality.unknownMembershipTrips)} real
          trips ride under that label). A few hundred distances arrive as
          negative integer-wraparound values near −4,294 km and are flagged
          out of distance totals. Every one of these is handled by an
          explicit, tested rule — never a silent guess. An unrecognized header
          stops the pipeline until a human maps it.
        </p>
      </Section>

      <Section title="Data quality">
        <p>
          The cleaning philosophy is flag, don't delete. Rows are dropped only
          when unusable: {formatNumber(meta.quality.droppedBlankStations)} with
          no station at either end,{" "}
          {formatNumber(meta.quality.droppedBadTimestamp)} with unparseable
          timestamps (including literal <Code>1900-01-00</Code> never-returned
          sentinels), and {formatNumber(meta.quality.droppedDuplicates)} exact
          duplicates from files that repeat their neighbours' trips. Another{" "}
          {formatNumber(meta.quality.rowsFlagged)} trips carry quality flags —
          sub-two-minute false starts, impossible durations, sentinel
          temperatures — and each aggregate excludes only the flags that
          invalidate it.{" "}
          <em>Caveat: the false-start exclusion (same-station return under 2 minutes)
          is an unvalidated heuristic affecting approximately 6% of otherwise-countable
          trips; some genuine very-short rides will be excluded alongside true false
          starts.</em>{" "}
          The full accounting regenerates with every pipeline run:{" "}
          <a
            className="text-primary underline-offset-2 hover:underline"
            href={REPORT_URL}
          >
            the data-quality report
          </a>{" "}
          is committed alongside{" "}
          <a
            className="text-primary underline-offset-2 hover:underline"
            href={REPO_URL}
          >
            the code
          </a>
          .
        </p>
      </Section>

      <Section title="Flows and implied rebalancing">
        <p>
          Every trip has two ends, so each station's hourly inflow and outflow
          — and its daily net imbalance — falls straight out of the fact
          table. The "bikes moved by hand" number is the average daily sum of
          absolute station imbalances across the network, divided by two
          (a moved bike leaves one station and lands at another). It is an
          inference, not a measurement: Mobi removes its crews' rebalancing
          trips before publishing, which is precisely why rider-created
          imbalance must be undone invisibly. Trips with only one resolvable
          end (~2% of recent months) count toward the end they have.{" "}
          <em>Caveat: the daily rebalancing figure is a conservative lower-bound
          inference — partial rebalancing during the day resets the imbalance
          clock before midnight, so the true number of bike movements is higher.</em>
        </p>
      </Section>

      <Section title="Scores and rules">
        <p>
          The connector score weighs five signals over the trailing twelve
          months: distance to rapid transit (30%, decaying to zero at 800 m),
          trip volume (25%, log-scaled), weekday commute-hour share (20%),
          e-bike share (10%), and destination diversity (15%). Opportunity
          findings are explicit rules over the same window — dock-capacity
          pressure against the network median, commute-heavy stations with
          bottom-quartile e-bike share, busy stations near transit that still
          score low — and every row cites the numbers that triggered it. One
          honest limit: dock-capacity findings read departures against current
          dock counts. That is a pressure signal, not proof of stockouts — the
          public data has no availability or historical-capacity record.
        </p>
      </Section>

      <Section title="Trip purpose and the detour factor">
        <p>
          "Two networks in one" rests on two derived measures. The detour
          factor divides a trip's odometer distance by the straight-line
          distance between its two stations' real coordinates — a proxy for
          how indirect the ride was, only computed where both ends resolve and
          the ratio is sane (1–5×, ends ≥300 m apart). The leisure label is a
          documented heuristic, not ground truth: points for a same-station
          round trip (+3), a seawall-adjacent endpoint (+2), rides over 40
          minutes (+2, over 20 +1), weekends (+1), midday departures (+1), and
          detours above 1.8× (+1); four points classifies a ride as leisure.
          The weights are visible in the published artifact and deliberately
          crude — the point is the contrast they reveal, not per-trip truth.
          One reported difference — e-bikes' higher median speed (13.3 vs 11.1
          km/h) — is odometer distance over total rental time, stopovers
          included, not a controlled pace measurement.
        </p>
      </Section>

      <Section title="Weather and the model">
        <p>
          Both the weather chapter and the ridership widget use Environment
          Canada daily observations for Vancouver Harbour (Open Government
          Licence – Canada), not the unreliable bike-sensor column. The weather
          chart classifies each day once by its ambient mean temperature and
          averages that day's trips, so “days near 22° see about N trips” is
          literally true. The widget is a gradient-boosted model (scikit-learn)
          over day of week, cyclical month, mean temperature, precipitation, and
          a BC-holiday flag, with rain constrained so more of it can never
          predict more trips. It is evaluated by a time split — trained on
          2017–2024, scored on unseen 2025-onward days, and it must beat a
          seasonal-naive baseline to ship. The predictions shown come from a
          model refit on all data and reflect the last complete year's demand;
          the browser gets a ~5 KB precomputed grid, not a live model.{" "}
          <strong className="font-medium text-foreground">Disclosure:</strong>{" "}
          approximately 178 days — 117 in 2020, the rest scattered — have no
          Environment Canada precipitation record and are excluded from model
          training; the model has not seen these weather conditions.
        </p>
      </Section>

      <Section title="What this data cannot say">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Hour-rounded timestamps mean time-of-day analysis carries ±30
            minutes of blur (April 2019, oddly, has minutes).
          </li>
          <li>No demographics, no routes — distances are per-bike odometer readings.</li>
          <li>
            Retired stations keep their trips but have no public coordinates,
            so geographic views cover {formatNumber(meta.totals.activeStations)}{" "}
            active stations, not all 312 ever seen.
          </li>
          <li>
            Temperature correlates with season and daylight; the weather chart
            shows association, not cause.
          </li>
        </ul>
      </Section>
    </Reveal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-lg font-medium tracking-tight text-foreground">{title}</h3>
      <div className="mt-3 text-base leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 text-[0.85em] text-foreground">
      {children}
    </code>
  );
}
