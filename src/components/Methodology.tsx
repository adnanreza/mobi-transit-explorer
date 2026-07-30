import { PipelineDiagram } from "@/components/PipelineDiagram";
import { Reveal } from "@/components/Reveal";
import {
  airquality,
  crashContext,
  forecast,
  meta,
  sourceSpanLabel,
  sourceSpanYearsLabel,
  windowLabel,
} from "@/data";

const formatNumber = (value: number) => value.toLocaleString("en-CA");

const REPORT_URL =
  "https://github.com/adnanreza/mobi-transit-explorer/blob/main/docs/data-quality-report.md";
const REPO_URL = "https://github.com/adnanreza/mobi-transit-explorer";

export function Methodology() {
  return (
    <Reveal stagger className="max-w-3xl space-y-14">
      <p className="text-lg leading-8 text-foreground">
        I moved to Vancouver in August 2015 and have never owned a car here.
        I get around by transit, bike share, and walking, with zero regrets
        and some fun along the way. Mobi arrived the summer after I did, so its entire public
        record overlaps my own years moving through this city. That's why{" "}
        {sourceSpanYearsLabel} of trip files aren't an abstract dataset to me,
        and why this section is the honest account of how they become the
        numbers above.
      </p>

      <Section title="The data">
        <p>
          Mobi by Rogers publishes a trip file for every month of operation:
          one workbook covering 2017, then monthly files from January 2018
          onward: {meta.quality.filesProcessed} files under the Mobi Data
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
          A staged Python + DuckDB pipeline runs locally. The site you're
          reading is static files. Each stage is re-runnable and counts its
          rows in and out:
        </p>
        <PipelineDiagram />
      </Section>

      <Section title="When a new month lands">
        <p>
          Mobi posts a new trip file roughly monthly, and absorbing it is a
          run, not a rebuild. A manifest scraper spots the new file on Mobi's
          page and pins its checksum; the header map either recognizes the
          layout or stops the pipeline until a human maps the drift; every
          number on this page regenerates from the warehouse; and a release
          gate byte-compares the committed artifacts against fresh output
          before anything ships. June 2026, the first month to arrive after
          this site launched, went from Mobi's Drive link to production in a
          single run: no header drift, one brand-new station (Callister Park
          – Fan Fest, opened for FIFA), and the dates in the copy above
          updated themselves because they derive from the data window. The
          run-by-run history lives in{" "}
          <a
            className="text-primary underline decoration-1 underline-offset-2 transition-colors hover:text-accent-foreground"
            href={REPO_URL}
          >
            the repo
          </a>
          .
        </p>
      </Section>

      <Section title={`${sourceSpanLabel[0].toUpperCase()}${sourceSpanLabel.slice(1)} of drift`}>
        <p>
          The archive is {sourceSpanLabel} ({windowLabel}) of quiet format entropy, and handling it is
          most of the work. Across {meta.quality.filesProcessed} files there
          are {meta.quality.headerLayouts} distinct column layouts. The
          membership column alone appears
          as <Code>Membership type</Code>, <Code>Membership Type</Code>,{" "}
          <Code>Formula</Code>, and the typo <Code>Memebership type</Code>.
          Timestamps come in five shapes, from Excel serial numbers to April
          2019's <Code>4/20/19 16:06</Code>. Three 2020 files use classic-Mac
          line endings; three 2023 files corrupt the Squamish-language station
          name šxʷƛ̓ənəq Xwtl'e7énḵ Square into invalid UTF-8. The trip files'
          temperature column comes from a bike-mounted sensor that reads high in
          sun, emits 0° sentinels, and reports values Vancouver has never seen
          (up to 45°C), so it is not used for weather. The weather chapter uses
          Environment Canada ambient readings instead. In May and June
          2025 station names lost their numeric IDs entirely (resolved through
          a name-to-ID crosswalk built from the prefixed months and the GBFS
          feed) while most membership labels went blank (kept and reported as
          Unknown; {formatNumber(meta.quality.unknownMembershipTrips)} real
          trips ride under that label). A few hundred distances arrive as
          negative integer-wraparound values near −4,294 km and are flagged
          out of distance totals. Every one of these is handled by an
          explicit, tested rule, never a silent guess. An unrecognized header
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
          {formatNumber(meta.quality.rowsFlagged)} trips carry quality flags:
          sub-two-minute false starts, impossible durations, and sentinel
          temperatures. Each aggregate excludes only the flags that
          invalidate it.{" "}
          <em>Caveat: the false-start exclusion (same-station return under 2 minutes)
          is an unvalidated heuristic affecting approximately 6% of otherwise-countable
          trips; some genuine very-short rides will be excluded alongside true false
          starts.</em>{" "}
          The full accounting regenerates with every pipeline run:{" "}
          <a
            className="text-primary underline decoration-1 underline-offset-2 transition-colors hover:text-accent-foreground"
            href={REPORT_URL}
          >
            the data-quality report
          </a>{" "}
          is committed alongside{" "}
          <a
            className="text-primary underline decoration-1 underline-offset-2 transition-colors hover:text-accent-foreground"
            href={REPO_URL}
          >
            the code
          </a>
          .
        </p>
      </Section>

      <Section title="Flows and implied rebalancing">
        <p>
          Every trip has two ends, so each station's hourly inflow, outflow,
          and daily net imbalance fall straight out of the fact table. The "bikes moved by hand" number is the average daily sum of
          absolute station imbalances across the network, divided by two
          (a moved bike leaves one station and lands at another). It is an
          inference, not a measurement: Mobi removes its crews' rebalancing
          trips before publishing, which is precisely why rider-created
          imbalance must be undone invisibly. Trips with only one resolvable
          end (~2% of recent months) count toward the end they have.{" "}
          <em>Caveat: the daily rebalancing figure is a conservative lower-bound
          inference. Partial rebalancing during the day resets the imbalance
          clock before midnight, so the true number of bike movements is higher.</em>
        </p>
      </Section>

      <Section title="Scores and rules">
        <p>
          The connector score weighs five signals over the trailing twelve
          months: distance to rapid transit (30%, decaying to zero at 800 m),
          trip volume (25%, log-scaled), weekday commute-hour share (20%),
          e-bike share (10%), and destination diversity (15%). Opportunity
          findings are explicit rules over the same window: dock-capacity
          pressure against the network median, commute-heavy stations with
          bottom-quartile e-bike share, and busy stations near transit that
          still score low. Every row cites the numbers that triggered it. One
          honest limit: dock-capacity findings read departures against current
          dock counts. That is a pressure signal, not proof of stockouts. The
          public data has no availability or historical-capacity record.
        </p>
      </Section>

      <Section title="Trip purpose and the detour factor">
        <p>
          "Two networks in one" rests on two derived measures. The detour
          factor divides a trip's odometer distance by the straight-line
          distance between its two stations' real coordinates. It is a proxy
          for how indirect the ride was, computed only where both ends resolve
          and the ratio is sane (1–5×, ends ≥300 m apart). The leisure label is a
          documented heuristic, not ground truth: points for a same-station
          round trip (+3), a seawall-adjacent endpoint (+2), rides over 40
          minutes (+2, over 20 +1), weekends (+1), midday departures (+1), and
          detours above 1.8× (+1); four points classifies a ride as leisure.
          The weights are visible in the published artifact and deliberately
          crude. The point is the contrast they reveal, not per-trip truth.
          One reported difference, e-bikes' higher median speed (13.3 vs 11.1
          km/h), is odometer distance over total rental time with stopovers
          included, not a controlled pace measurement.
        </p>
      </Section>

      <Section title="Weather and the model">
        <p>
          Both the weather chapter and the ridership widget use Environment
          Canada daily observations for Vancouver Harbour (Open Government
          Licence – Canada), not the unreliable bike-sensor column. The weather
          chart classifies each day once by its ambient mean temperature and
          averages that day's trips, so "days near 22° see about N trips" is
          literally true. The widget is a gradient-boosted model (scikit-learn)
          over day of week, cyclical month, mean temperature, precipitation, and
          a BC-holiday flag, with rain constrained so more of it can never
          predict more trips. It is evaluated by a time split: trained on
          2017–2024, scored on unseen 2025-onward days, and required to beat
          a seasonal-naive baseline before it ships. The predictions shown come from a
          model refit on all data and reflect the last complete year's demand;
          the browser gets a ~5 KB precomputed grid, not a live model.{" "}
          <strong className="font-medium text-foreground">Disclosure:</strong>{" "}
          the model omits{" "}
          {formatNumber(forecast.modelCard.droppedDays.total)} days lacking
          Environment Canada precipitation:{" "}
          {formatNumber(forecast.modelCard.droppedDays.trainingWindow)} in the
          2017–2024 fitting window (most in 2020), and{" "}
          {formatNumber(forecast.modelCard.droppedDays.holdoutWindow)} in the
          2025+ evaluation window; the model has not been fitted on or scored
          against these conditions.
        </p>
      </Section>

      <Section title="Air quality">
        <p>
          The smoke chapter uses hourly PM2.5 from the BC ENV Air Data
          Archive. {airquality.licence.attribution} The station of record is{" "}
          {airquality.primaryStation}, the only monitor inside the service
          area with full coverage since{" "}
          {(airquality.coverage.firstDay ?? "").slice(0, 4)}. It sits beside a
          truck route, so a smoke day must pass a second test: the 24-hour
          mean has to exceed {airquality.smokeThresholdUgM3} ug/m3, BC's air
          quality objective, at both {airquality.primaryStation} and{" "}
          {airquality.corroboratingStation}. Regional smoke lifts both
          stations at once; local traffic cannot. The province has verified
          readings through {airquality.verifiedThrough.slice(0, 4)}; later
          readings come from its unverified daily feed and are used as
          published. Every smoke day is compared with clear days in the same
          month and year, because wildfire season is also peak riding season
          and any wider comparison would launder seasonality into an air
          quality claim. Daily mean PM2.5 was also tested as a forecast model
          feature on the same {forecast.modelCard.testRange.slice(0, 4)}
          -onward holdout, fit and scored on an identical day pool with and
          without it. It did not improve the model, so it is not a model
          input and the numbers above stay association, not prediction. The
          exact comparison lives in the spec for this feature in the repo.
        </p>
      </Section>

      <Section title="Crash context">
        <p>
          Station panels carry a count of reported cyclist-involved crashes
          within {crashContext.radiusM} m, from ICBC's public crash data
          ({crashContext.vintage.from} to {crashContext.vintage.to}).{" "}
          {crashContext.licence.attribution} The scope is the two
          municipalities Mobi serves, the City of Vancouver and the UBC campus,
          which ICBC publishes separately. A crash counts as a casualty crash
          when at least one person was injured or killed; the public extract
          does not separate those two outcomes.
        </p>
        <p className="mt-4">
          Four limits bound what the number means. It counts crashes reported
          to an insurer, so bike-only falls, dooring, and no-contact incidents
          are invisible and every count is a floor. It covers all cyclists, not
          Mobi riders, so it describes the streets around a dock rather than
          anything about Mobi's own riders, and it describes them across the
          whole window even where the dock itself is newer than that. The
          public window rolls{" "}
          {crashContext.vintage.to - crashContext.vintage.from + 1} years and
          ICBC revises counts as late reports arrive, so a year's figure is not
          frozen. And{" "}
          {formatNumber(crashContext.city.crashesWithoutCoordinates)} of{" "}
          {formatNumber(crashContext.city.crashes)} crashes carry no
          coordinates, so they appear in these totals but in no station's
          count.
        </p>
        <p className="mt-4">
          Dock catchments overlap, so one crash is often within{" "}
          {crashContext.radiusM} m of several stations:{" "}
          {formatNumber(crashContext.accounting.crashesMatchingMultipleStations)} of{" "}
          {formatNumber(crashContext.accounting.matchedUniqueCrashes)} located
          crashes near a dock are counted by more than one, so the per-station
          figures sum to{" "}
          {formatNumber(crashContext.accounting.stationAssignments)} rather than{" "}
          {formatNumber(crashContext.accounting.matchedUniqueCrashes)}. The
          published artifact states both.{" "}
          {formatNumber(crashContext.accounting.nearNoStationCrashes)} located
          crashes fall near no station at all.
        </p>
        <p className="mt-4">
          The {crashContext.radiusM} m radius is a judgement, so the
          alternatives ship beside it:{" "}
          {crashContext.radiusSensitivity
            .map(
              (row) =>
                `${row.radiusM} m matches ${formatNumber(row.matchedUniqueCrashes)} crashes and leaves ${row.stationsWithNone} docks with none`,
            )
            .join("; ")}
          . A block is the walk-up scale of a dock, which is why the middle
          figure is the published one.
        </p>
        <p className="mt-4">
          No crash rate per trip is published, and that is deliberate. Dividing
          all-cyclist crashes by Mobi departures would not correct for
          exposure; it would invent a rate for a population the denominator
          never measures, and a quotient like that reads as per-ride risk no
          matter how it is labelled. For the same reason no departure total is
          printed beside these counts: handing over both operands is the same
          act one step removed. Any ratio built from numbers elsewhere on this
          page would also be wrong, because the station panel's trip figure
          covers a trailing twelve months rather than these five years.{" "}
          <em>{crashContext.licence.disclaimer}</em>
        </p>
      </Section>

      <Section title="What this data cannot say">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Hour-rounded timestamps mean time-of-day analysis carries ±30
            minutes of blur (April 2019, oddly, has minutes).
          </li>
          <li>No demographics and no routes. Distances are per-bike odometer readings.</li>
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
      <h3 className="eyebrow">{title}</h3>
      <div className="mt-4 text-base leading-7 text-muted-foreground">{children}</div>
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
