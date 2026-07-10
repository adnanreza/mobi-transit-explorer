import { Bar, Line } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import { hourly, lastCompleteYear, stationsArtifact } from "@/data";
import { chartColors } from "@/components/charts/chartTheme";
import { ChartReveal } from "@/components/charts/ChartReveal";
import { Reveal } from "@/components/Reveal";

const latestHourly = hourly.find((row) => row.year === lastCompleteYear);
const topStations = stationsArtifact.stations.slice(0, 8);
const hourLabels = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);

export function RealMobiCharts() {
  const testMode = import.meta.env.MODE === "test";

  return (
    <Reveal stagger className="grid gap-x-12 gap-y-16 lg:grid-cols-2">
      <ChartBlock
        title={`Hourly departures, ${lastCompleteYear}`}
        caption="Weekdays peak twice — the morning and evening commute. Weekends build to one long afternoon. Timestamps are hour-rounded at source."
      >
        {testMode ? (
          <ChartPlaceholder label="Hourly departures chart" />
        ) : (
          <ChartReveal>
          <Line
            data={{
              labels: hourLabels,
              datasets: [
                {
                  label: "Weekday",
                  data: latestHourly?.weekday ?? [],
                  borderColor: chartColors.grayStrong,
                  backgroundColor: chartColors.graySoft,
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0.35,
                  fill: true,
                },
                {
                  label: "Weekend",
                  data: latestHourly?.weekend ?? [],
                  borderColor: chartColors.blue,
                  backgroundColor: chartColors.blueSoft,
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0.35,
                  fill: true,
                },
              ],
            }}
            options={lineOptions("Departures", true)}
          />
          </ChartReveal>
        )}
      </ChartBlock>

      <ChartBlock
        title="Busiest stations, trailing 12 months"
        caption={`${topStations[0]?.name ?? ""} leads the network — the seawall, not the office towers, drives peak demand.`}
      >
        {testMode ? (
          <ChartPlaceholder label="Top stations chart" />
        ) : (
          <ChartReveal>
          <Bar
            data={{
              labels: topStations.map((station) => station.name),
              datasets: [
                {
                  label: "Departures",
                  data: topStations.map((station) => station.trailing12.trips),
                  backgroundColor: topStations.map((_, index) =>
                    index === 0 ? chartColors.blue : chartColors.gray,
                  ),
                  borderRadius: 4,
                },
              ],
            }}
            options={barOptions("Departures")}
          />
          </ChartReveal>
        )}
      </ChartBlock>
    </Reveal>
  );
}

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
    >
      {label}
    </div>
  );
}

function ChartBlock({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure>
      <h3 className="text-lg font-medium tracking-tight text-foreground">{title}</h3>
      <div className="mt-4 h-64">{children}</div>
      <figcaption className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

function barOptions(label: string): ChartOptions<"bar"> {
  return {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) =>
            `${label}: ${Number(context.parsed.x).toLocaleString("en-CA")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartColors.grid },
        ticks: { callback: (value: string | number) => Number(value).toLocaleString("en-CA") },
      },
      y: { grid: { display: false } },
    },
  };
}

function lineOptions(label: string, showLegend: boolean): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${context.dataset.label ?? label}: ${Number(context.parsed.y).toLocaleString("en-CA")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 9 },
      },
      y: {
        beginAtZero: true,
        grid: { color: chartColors.grid },
        ticks: { callback: (value: string | number) => Number(value).toLocaleString("en-CA") },
      },
    },
  };
}
