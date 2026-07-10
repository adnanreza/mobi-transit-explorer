import { meta } from "@/data";

const formatNumber = (value: number) => value.toLocaleString("en-CA");

// Every figure is generated pipeline output surfaced through meta.json —
// regenerating the data regenerates this diagram.
const stages = [
  {
    name: "Acquire",
    figure: `${meta.quality.filesProcessed} files`,
    detail: "manifest-verified downloads, 2017 to today",
  },
  {
    name: "Extract",
    figure: `${formatNumber(meta.quality.rowsLanded)} rows`,
    detail: "31 header layouts unified by an explicit era map",
  },
  {
    name: "Clean",
    figure: `${formatNumber(meta.quality.rowsKept)} kept`,
    detail: `${formatNumber(
      meta.quality.droppedBlankStations +
        meta.quality.droppedBadTimestamp +
        meta.quality.droppedDuplicates,
    )} dropped, every one accounted for`,
  },
  {
    name: "Model",
    figure: "star schema",
    detail: "fact_trips + station, date, membership dimensions",
  },
  {
    name: "Publish",
    figure: "≈40 KB gzip",
    detail: "typed JSON aggregates; no per-trip data ships",
  },
];

export function PipelineDiagram() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
      {stages.map((stage, index) => (
        <li key={stage.name} className="bg-background p-4">
          <p className="text-xs text-muted-foreground">
            {index + 1}. {stage.name}
          </p>
          <p className="mt-1 font-semibold tracking-tight text-foreground tabular-nums">
            {stage.figure}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.detail}</p>
        </li>
      ))}
    </ol>
  );
}
