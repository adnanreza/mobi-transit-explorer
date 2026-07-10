import { PipelineDiagram } from "@/components/PipelineDiagram";
import { meta } from "@/data";

const formatNumber = (value: number) => value.toLocaleString("en-CA");

const REPORT_URL =
  "https://github.com/adnanreza/mobi-transit-explorer/blob/main/docs/data-quality-report.md";
const REPO_URL = "https://github.com/adnanreza/mobi-transit-explorer";

export function Methodology() {
  return (
    <div className="max-w-3xl space-y-14">
      <p className="text-lg leading-8 text-foreground">
        I live in Vancouver without a car. Mobi, my feet, and TransLink are how
        I move through this city — so when Mobi publishes nine years of trip
        data, that's not an abstract dataset to me. This section is the honest
        account of how those files become the numbers above.
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

      <Section title="Nine years of drift">
        <p>
          The archive is nine years of quiet format entropy, and handling it is
          most of the work. Across {meta.quality.filesProcessed} files there
          are 31 distinct column layouts — the membership column alone appears
          as <Code>Membership type</Code>, <Code>Membership Type</Code>,{" "}
          <Code>Formula</Code>, and the typo <Code>Memebership type</Code>.
          Timestamps come in five shapes, from Excel serial numbers to April
          2019's <Code>4/20/19 16:06</Code>. Three 2020 files use classic-Mac
          line endings; three 2023 files corrupt the Squamish-language station
          name šxʷƛ̓ənəq Xwtl'e7énḵ Square into invalid UTF-8; from mid-2025,
          missing temperatures arrive as 0° instead of null. Every one of these
          is handled by an explicit, tested rule — never a silent guess. An
          unrecognized header stops the pipeline until a human maps it.
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
          invalidate it. The full accounting regenerates with every pipeline
          run:{" "}
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

      <Section title="Scores and rules">
        <p>
          The connector score weighs five signals over the trailing twelve
          months: distance to rapid transit (30%, decaying to zero at 800 m),
          trip volume (25%, log-scaled), weekday commute-hour share (20%),
          e-bike share (10%), and destination diversity (15%). Opportunity
          findings are explicit rules over the same window — dock-capacity
          pressure against the network median, commute-heavy stations with
          bottom-quartile e-bike share, busy stations near transit that still
          score low — and every row cites the numbers that triggered it.
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
    </div>
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
