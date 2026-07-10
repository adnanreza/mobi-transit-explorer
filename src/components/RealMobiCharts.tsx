import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import {
  hourly,
  lastCompleteYear,
  meta,
  monthly,
  stationsArtifact,
  yearly,
} from "@/data";
import { chartColors } from "@/components/charts/chartTheme";

const latestHourly = hourly.find((row) => row.year === lastCompleteYear);
const latestYearly = yearly.find((row) => row.year === lastCompleteYear);
const topStations = stationsArtifact.stations.slice(0, 8);
const hourLabels = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);
const ebikeShare = latestYearly?.ebikeSharePct ?? 0;

export function RealMobiCharts() {
  const testMode = import.meta.env.MODE === "test";

  return (
    <div className="grid gap-x-12 gap-y-16 lg:grid-cols-2">
      <ChartBlock
        title="Trips per month since 2017"
        caption={`${meta.totals.trips.toLocaleString("en-CA")} rider trips over ${monthly.length} months. The seasonal wave repeats every year; 2020 bends it without breaking it.`}
      >
        {testMode ? (
          <ChartPlaceholder label="Monthly trips chart" />
        ) : (
          <Line
            data={{
              labels: monthly.map((row) => row.month),
              datasets: [
                {
                  label: "Trips",
                  data: monthly.map((row) => row.trips),
                  borderColor: chartColors.blue,
                  backgroundColor: chartColors.blueSoft,
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0.3,
                  fill: true,
                },
              ],
            }}
            options={lineOptions("Trips", false)}
          />
        )}
      </ChartBlock>

      <ChartBlock
        title={`Hourly departures, ${lastCompleteYear}`}
        caption="Weekdays peak twice — the morning and evening commute. Weekends build to one long afternoon. Timestamps are hour-rounded at source."
      >
        {testMode ? (
          <ChartPlaceholder label="Hourly departures chart" />
        ) : (
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
        )}
      </ChartBlock>

      <ChartBlock
        title={`Bike type split, ${lastCompleteYear}`}
        caption={`E-bikes carried ${ebikeShare}% of ${lastCompleteYear} trips — the fastest behavioural change in the network's history.`}
      >
        <div className="mx-auto h-64 max-w-xs">
          {testMode ? (
            <ChartPlaceholder label="Bike type split chart" />
          ) : (
            <Doughnut
              data={{
                labels: ["Classic", "E-bike"],
                datasets: [
                  {
                    data: [100 - ebikeShare, ebikeShare],
                    backgroundColor: [chartColors.gray, chartColors.blue],
                    borderColor: "#ffffff",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
              }}
            />
          )}
        </div>
      </ChartBlock>

      <ChartBlock
        title="Busiest stations, trailing 12 months"
        caption={`${topStations[0]?.name ?? ""} leads the network — the seawall, not the office towers, drives peak demand.`}
      >
        {testMode ? (
          <ChartPlaceholder label="Top stations chart" />
        ) : (
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
        )}
      </ChartBlock>
    </div>
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
