import { useState } from "react";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { chartColors } from "@/components/charts/chartTheme";
import { ChartReveal } from "@/components/charts/ChartReveal";
import { StationFinder } from "@/components/StationFinder";
import { flows, stationsArtifact } from "@/data";
import {
  eveningExporters,
  morningImporters,
  stationBalance,
  stationDayProfile,
  type DayType,
} from "@/components/flows/flowsContent";
import { cn } from "@/lib/utils";

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);
const DEFAULT_STATION = morningImporters(flows, 1)[0]?.id ?? "0021";

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true } },
  scales: {
    x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 9 } },
    y: {
      beginAtZero: true,
      grid: { color: chartColors.grid },
      title: { display: true, text: "bikes per hour (avg)" },
    },
  },
};

export function FlowsSection() {
  const testMode = import.meta.env.MODE === "test";
  const [stationId, setStationId] = useState<string>(DEFAULT_STATION);
  const [dayType, setDayType] = useState<DayType>("weekday");

  const importers = morningImporters();
  const exporters = eveningExporters();
  const profile = stationDayProfile(stationId, dayType);
  const balance = stationBalance(stationId);
  const stationName =
    stationsArtifact.stations.find((s) => s.id === stationId)?.name ?? stationId;

  return (
    <div className="space-y-16">
      <div>
        <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          An estimated {flows.networkDailyRebalancing.toLocaleString("en-CA")} bikes a day,
          moved by hand.
        </p>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
          Riders don't return bikes where they found them. Offices soak up
          bikes every weekday morning; homes and beaches drain them back out
          by night. The imbalance riders create is work Mobi's crews must undo
          — the number above is the average daily redistribution the trip
          data implies. Mobi removes its own crew trips before publishing, so
          this is inference, and it's labelled that way in the methodology.
        </p>
      </div>

      <div className="grid min-w-0 gap-x-12 gap-y-10 border-t border-border pt-10 md:grid-cols-2 [&>*]:min-w-0">
        <RankedList
          title="Filling up on weekday mornings"
          caption="Net bikes gained, 7:00–11:00, per weekday — the commute's landing zones."
          rows={importers}
          unit="gained/morning"
        />
        <RankedList
          title="Draining on weekday evenings"
          caption="Net bikes shed, 16:00–20:00, per weekday — where the ride home starts."
          rows={exporters}
          unit="shed/evening"
        />
      </div>

      <div className="border-t border-border pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs flex-1">
            <StationFinder
              selectedStationId={stationId}
              onStationSelect={setStationId}
            />
          </div>
          <div className="flex gap-1" role="group" aria-label="Day type">
            {(["weekday", "weekend"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={dayType === option}
                onClick={() => setDayType(option)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  dayType === option
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "weekday" ? "Weekdays" : "Weekends"}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-base font-medium tracking-tight text-foreground">
          {stationName}
          <span className="font-normal text-muted-foreground">
            {" "}
            — a typical {dayType === "weekday" ? "weekday" : "weekend day"}, hour by hour
          </span>
        </p>
        <div className="mt-4 h-64 min-w-0 sm:h-72">
          {testMode ? (
            <div
              role="img"
              aria-label="Station flow chart"
              className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
            >
              Station flow chart
            </div>
          ) : (
            // key remounts the chart on every change, replaying the draw
            // animation — switching stations is visibly a new chart
            <ChartReveal key={`${stationId}-${dayType}`}>
              <Line
                data={{
                  labels: HOUR_LABELS,
                  datasets: [
                    {
                      label: "Departures (draining)",
                      data: profile?.dep ?? [],
                      borderColor: chartColors.grayStrong,
                      backgroundColor: chartColors.graySoft,
                      borderWidth: 1.5,
                      pointRadius: 0,
                      tension: 0.35,
                      fill: true,
                    },
                    {
                      label: "Returns (filling)",
                      data: profile?.ret ?? [],
                      borderColor: chartColors.blue,
                      backgroundColor: chartColors.blueSoft,
                      borderWidth: 1.5,
                      pointRadius: 0,
                      tension: 0.35,
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </ChartReveal>
          )}
        </div>
        {balance ? (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Average arrivals and departures per {dayType === "weekday" ? "weekday" : "weekend day"},
            by hour. Over the trailing year this station's intraday imbalance
            peaks at about {balance.avgPeakSwing.toLocaleString("en-CA")} bikes
            on a typical day
            {Math.abs(balance.avgDailyNet) >= 0.5
              ? `, and it ends the day ${Math.abs(balance.avgDailyNet).toLocaleString("en-CA")} bikes ${
                  balance.avgDailyNet > 0 ? "over" : "short"
                } on average`
              : ""}
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RankedList({
  title,
  caption,
  rows,
  unit,
}: {
  title: string;
  caption: string;
  rows: { id: string; name: string; bikesPerDay: number }[];
  unit: string;
}) {
  const max = Math.max(...rows.map((row) => row.bikesPerDay), 1);
  return (
    <div>
      <h3 className="text-lg font-medium tracking-tight text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
      <ol className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:max-w-56 sm:flex-none">
              {row.name}
            </span>
            <span
              className="hidden h-1.5 rounded-full bg-primary/70 sm:block"
              style={{ width: `${(row.bikesPerDay / max) * 100}%`, maxWidth: "30%" }}
              aria-hidden="true"
            />
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {row.bikesPerDay} {unit}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
