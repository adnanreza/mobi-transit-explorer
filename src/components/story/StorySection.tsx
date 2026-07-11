import { Bar, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { chartColors } from "@/components/charts/chartTheme";
import { ChartReveal } from "@/components/charts/ChartReveal";
import { Reveal } from "@/components/Reveal";
import { lastCompleteYear, monthly, seasonality, stationsArtifact, weather } from "@/data";
import {
  chapters,
  ebikeChapter,
  growthChapter,
  pandemicChapter,
  purposeChapter,
  seasonsChapter,
  weatherChapter,
} from "@/components/story/storyContent";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const quietLine: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
    y: {
      beginAtZero: true,
      grid: { color: chartColors.grid },
      ticks: { callback: (v: string | number) => Number(v).toLocaleString("en-CA") },
    },
  },
};

function growthData(): ChartData<"line"> {
  return {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        data: monthly.map((m) => m.trips),
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blueSoft,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  };
}

function seasonsData(): ChartData<"line"> {
  const complete = seasonality.filter(
    (r) => r.year <= lastCompleteYear && r.tripsByMonth.every((m) => m !== null && m > 0),
  );
  return {
    labels: MONTH_LABELS,
    datasets: complete.map((r) => ({
      label: String(r.year),
      data: r.tripsByMonth,
      borderColor: r.year === lastCompleteYear ? chartColors.blue : chartColors.gray,
      borderWidth: r.year === lastCompleteYear ? 2 : 1,
      pointRadius: 0,
      tension: 0.35,
    })),
  };
}

function pandemicData(): ChartData<"line"> {
  const inWindow = (month: string) => month >= "2019-06" && month <= "2022-06";
  return {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        data: monthly.map((m) => m.trips),
        borderColor: chartColors.gray,
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        data: monthly.map((m) => (inWindow(m.month) ? m.trips : null)),
        borderColor: chartColors.blue,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };
}

function ebikeData(): ChartData<"line"> {
  const withFlag = monthly.filter((m) => m.ebikeTrips !== null && m.ebikeTrips > 0);
  return {
    labels: withFlag.map((m) => m.month),
    datasets: [
      {
        data: withFlag.map((m) => Math.round((1000 * (m.ebikeTrips ?? 0)) / m.trips) / 10),
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blueSoft,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  };
}

function weatherData(): ChartData<"bar"> {
  // True per-day averages, one row per EC ambient temperature band.
  const peak = weather.reduce((a, b) => (b.tripsPerDay > a.tripsPerDay ? b : a));
  return {
    labels: weather.map((w) => `${w.tempBandC}°`),
    datasets: [
      {
        data: weather.map((w) => w.tripsPerDay),
        backgroundColor: weather.map((w) =>
          w.tempBandC === peak.tempBandC ? chartColors.blue : chartColors.gray,
        ),
        borderRadius: 3,
      },
    ],
  };
}

function purposeData(): ChartData<"bar"> {
  // Every classified station, sorted by leisure share: the cliff between the
  // seawall stations and the rest IS the chart.
  const sorted = stationsArtifact.stations
    .filter((s) => s.leisureSharePct !== null)
    .sort((a, b) => (b.leisureSharePct ?? 0) - (a.leisureSharePct ?? 0));
  return {
    labels: sorted.map((s) => s.name),
    datasets: [
      {
        data: sorted.map((s) => s.leisureSharePct ?? 0),
        backgroundColor: sorted.map((s) =>
          (s.leisureSharePct ?? 0) >= 50 ? chartColors.blue : chartColors.gray,
        ),
        borderRadius: 1,
        barPercentage: 1,
        categoryPercentage: 0.9,
      },
    ],
  };
}

const purposeOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { display: false },
    y: {
      beginAtZero: true,
      max: 100,
      grid: { color: chartColors.grid },
      ticks: { callback: (v: string | number) => `${v}%` },
    },
  },
};

const percentLine: ChartOptions<"line"> = {
  ...quietLine,
  scales: {
    ...quietLine.scales,
    y: {
      beginAtZero: true,
      grid: { color: chartColors.grid },
      ticks: { callback: (v: string | number) => `${v}%` },
    },
  },
};

export function StorySection() {
  const testMode = import.meta.env.MODE === "test";
  const byId = {
    growth: growthChapter(),
    seasons: seasonsChapter(),
    pandemic: pandemicChapter(),
    ebikes: ebikeChapter(),
    weather: weatherChapter(),
    purpose: purposeChapter(),
  };

  const charts: Record<string, React.ReactNode> = testMode
    ? {}
    : {
        growth: (
          <ChartReveal>
            <Line data={growthData()} options={quietLine} />
          </ChartReveal>
        ),
        seasons: (
          <ChartReveal>
            <Line data={seasonsData()} options={quietLine} />
          </ChartReveal>
        ),
        pandemic: (
          <ChartReveal>
            <Line data={pandemicData()} options={quietLine} />
          </ChartReveal>
        ),
        ebikes: (
          <ChartReveal>
            <Line data={ebikeData()} options={percentLine} />
          </ChartReveal>
        ),
        purpose: (
          <ChartReveal>
            <Bar data={purposeData()} options={purposeOptions} />
          </ChartReveal>
        ),
        weather: (
          <ChartReveal>
          <Bar
            data={weatherData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: {
                  title: { display: true, text: "trips per day" },
                  grid: { color: chartColors.grid },
                  ticks: {
                    callback: (v: string | number) => Number(v).toLocaleString("en-CA"),
                  },
                },
              },
            }}
          />
          </ChartReveal>
        ),
      };

  return (
    <div className="space-y-28 sm:space-y-36">
      {chapters.map((chapter, index) => {
        const content = byId[chapter.id as keyof typeof byId];
        return (
          <Reveal key={chapter.id} delay={index === 0 ? 0 : 80}>
            <article aria-labelledby={`story-${chapter.id}`}>
              <h3
                id={`story-${chapter.id}`}
                className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
              >
                {content.headline}
              </h3>
              <div className="mt-10 h-64 sm:h-80">
                {testMode ? (
                  <div
                    role="img"
                    aria-label={`${chapter.id} chart`}
                    className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
                  >
                    {chapter.id} chart
                  </div>
                ) : (
                  charts[chapter.id]
                )}
              </div>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
                {content.caption}
              </p>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
