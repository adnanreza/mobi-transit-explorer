import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Bike, Clock3, Database, MapPin } from "lucide-react";
import type { ChartOptions, TooltipItem } from "chart.js";
import { realMobiDataSummary } from "@/data/realMobi";
import "@/components/charts/chartSetup";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const blue = "#008fd3";
const slate = "#334155";
const green = "#16a34a";
const purple = "#9333ea";

export function RealMobiCharts() {
  const { charts, months } = realMobiDataSummary;
  const testMode = import.meta.env.MODE === "test";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard
        icon={Database}
        title="Monthly trips"
        description={`${months[0].trips.toLocaleString("en-CA")} April trips and ${months[1].trips.toLocaleString("en-CA")} May trips from Mobi public CSVs.`}
      >
        {testMode ? (
          <ChartPlaceholder label="Monthly trips chart" />
        ) : (
          <Bar
            data={{
              labels: charts.monthlyTrips.labels,
              datasets: [
                {
                  label: "Classic",
                  data: charts.monthlyTrips.classicTrips,
                  backgroundColor: slate,
                  borderRadius: 8,
                  stack: "trips",
                },
                {
                  label: "E-bike",
                  data: charts.monthlyTrips.ebikeTrips,
                  backgroundColor: blue,
                  borderRadius: 8,
                  stack: "trips",
                },
              ],
            }}
            options={barOptions("Trips")}
          />
        )}
      </ChartCard>

      <ChartCard
        icon={Clock3}
        title="Hourly departures"
        description="Departure hour from the rounded public timestamps."
      >
        {testMode ? (
          <ChartPlaceholder label="Hourly departures chart" />
        ) : (
          <Line
            data={{
              labels: charts.hourlyDepartures.labels,
              datasets: charts.hourlyDepartures.series.map((series, index) => ({
                label: series.label,
                data: series.data,
                borderColor: index === 0 ? slate : blue,
                backgroundColor: index === 0 ? "rgba(51, 65, 85, 0.08)" : "rgba(0, 143, 211, 0.12)",
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.35,
                fill: true,
              })),
            }}
            options={lineOptions("Departures")}
          />
        )}
      </ChartCard>

      <ChartCard
        icon={Bike}
        title="Bike type split"
        description="Combined April and May split from the `Electric bike` column."
      >
        <div className="mx-auto h-72 max-w-sm">
          {testMode ? (
            <ChartPlaceholder label="Bike type split chart" />
          ) : (
            <Doughnut
              data={{
                labels: charts.bikeTypeSplit.labels,
                datasets: [
                  {
                    data: charts.bikeTypeSplit.data,
                    backgroundColor: [slate, purple],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { boxWidth: 12, boxHeight: 12 },
                  },
                },
              }}
            />
          )}
        </div>
      </ChartCard>

      <ChartCard
        icon={MapPin}
        title="Top May stations"
        description="Highest-volume stations in the May 2026 generated station set."
      >
        {testMode ? (
          <ChartPlaceholder label="Top May stations chart" />
        ) : (
          <Bar
            data={{
              labels: charts.topStations.labels,
              datasets: [
                {
                  label: "Departures",
                  data: charts.topStations.data,
                  backgroundColor: green,
                  borderRadius: 8,
                },
              ],
            }}
            options={barOptions("Departures", true)}
          />
        )}
      </ChartCard>
    </div>
  );
}

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-full items-center justify-center rounded-lg border border-dashed bg-slate-50 text-sm text-muted-foreground"
    >
      {label}
    </div>
  );
}

function ChartCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Database;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <Badge variant="outline" className="w-fit bg-white text-muted-foreground">
          Real Mobi CSV
        </Badge>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">{children}</div>
      </CardContent>
    </Card>
  );
}

function barOptions(label: string, horizontal = false): ChartOptions<"bar"> {
  return {
    indexAxis: horizontal ? ("y" as const) : ("x" as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            const value = horizontal ? context.parsed.x : context.parsed.y;
            return `${context.dataset.label ?? label}: ${Number(value).toLocaleString("en-CA")}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: !horizontal,
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: { callback: (value: string | number) => Number(value).toLocaleString("en-CA") },
      },
      y: {
        stacked: !horizontal,
        grid: { display: !horizontal },
        ticks: horizontal ? undefined : { callback: (value: string | number) => Number(value).toLocaleString("en-CA") },
      },
    },
  };
}

function lineOptions(label: string): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
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
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: { callback: (value: string | number) => Number(value).toLocaleString("en-CA") },
      },
    },
  };
}
