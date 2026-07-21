import { Bar, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useChartColors, type ChartColors } from "@/components/charts/chartTheme";
import { ChartReveal } from "@/components/charts/ChartReveal";
import { Reveal } from "@/components/Reveal";
import { lastCompleteYear, monthly, seasonality, stationsArtifact, weather, yearly } from "@/data";
import {
  chapters,
  ebikeChapter,
  growthChapter,
  membershipChapter,
  pandemicChapter,
  purposeChapter,
  seasonsChapter,
  weatherChapter,
} from "@/components/story/storyContent";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Data and options are built per render from the active chart palette so the
// story recolors when the theme flips (ChartReveal remounts each canvas).

function quietLine(c: ChartColors): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
      y: {
        beginAtZero: true,
        grid: { color: c.grid },
        ticks: { callback: (v: string | number) => Number(v).toLocaleString("en-CA") },
      },
    },
  };
}

function growthData(c: ChartColors): ChartData<"line"> {
  return {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        data: monthly.map((m) => m.trips),
        borderColor: c.blue,
        backgroundColor: c.blueSoft,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  };
}

function seasonsData(c: ChartColors): ChartData<"line"> {
  const complete = seasonality.filter(
    (r) => r.year <= lastCompleteYear && r.tripsByMonth.every((m) => m !== null && m > 0),
  );
  return {
    labels: MONTH_LABELS,
    datasets: complete.map((r) => ({
      label: String(r.year),
      data: r.tripsByMonth,
      borderColor: r.year === lastCompleteYear ? c.blue : c.gray,
      borderWidth: r.year === lastCompleteYear ? 2 : 1,
      pointRadius: 0,
      tension: 0.35,
    })),
  };
}

function pandemicData(c: ChartColors): ChartData<"line"> {
  const inWindow = (month: string) => month >= "2019-06" && month <= "2022-06";
  return {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        data: monthly.map((m) => m.trips),
        borderColor: c.gray,
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        data: monthly.map((m) => (inWindow(m.month) ? m.trips : null)),
        borderColor: c.blue,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };
}

function ebikeData(c: ChartColors): ChartData<"line"> {
  const withFlag = monthly.filter((m) => m.ebikeTrips !== null && m.ebikeTrips > 0);
  return {
    labels: withFlag.map((m) => m.month),
    datasets: [
      {
        data: withFlag.map((m) => Math.round((1000 * (m.ebikeTrips ?? 0)) / m.trips) / 10),
        borderColor: c.blue,
        backgroundColor: c.blueSoft,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  };
}

function weatherData(c: ChartColors): ChartData<"bar"> {
  // True per-day averages, one row per EC ambient temperature band.
  const peak = weather.reduce((a, b) => (b.tripsPerDay > a.tripsPerDay ? b : a));
  return {
    labels: weather.map((w) => `${w.tempBandC}°`),
    datasets: [
      {
        data: weather.map((w) => w.tripsPerDay),
        backgroundColor: weather.map((w) =>
          w.tempBandC === peak.tempBandC ? c.blue : c.gray,
        ),
        borderRadius: 3,
      },
    ],
  };
}

function purposeData(c: ChartColors): ChartData<"bar"> {
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
          (s.leisureSharePct ?? 0) >= 50 ? c.blue : c.gray,
        ),
        borderRadius: 1,
        barPercentage: 1,
        categoryPercentage: 0.9,
      },
    ],
  };
}

function purposeOptions(c: ChartColors): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: c.grid },
        ticks: { callback: (v: string | number) => `${v}%` },
      },
    },
  };
}

function percentLine(c: ChartColors): ChartOptions<"line"> {
  return {
    ...quietLine(c),
    scales: {
      ...quietLine(c).scales,
      y: {
        beginAtZero: true,
        grid: { color: c.grid },
        ticks: { callback: (v: string | number) => `${v}%` },
      },
    },
  };
}

// Share of each pass type over the years — Corporate highlighted, the rest
// in the gray ramp. Legend shown because five lines need naming.
function membershipGroups(c: ChartColors): { key: string; color: string; width: number }[] {
  return [
    { key: "Corporate", color: c.blue, width: 2 },
    { key: "365 Annual", color: c.ink, width: 1.5 },
    { key: "Casual", color: c.grayStrong, width: 1.5 },
    { key: "Monthly", color: c.gray, width: 1.5 },
    { key: "Community", color: c.faint, width: 1.5 },
  ];
}

function membershipData(c: ChartColors): ChartData<"line"> {
  const years = yearly.filter((y) => y.year <= lastCompleteYear);
  const share = (row: (typeof years)[number], group: string) => {
    const total = Object.values(row.membershipMix).reduce((a, b) => a + b, 0) || 1;
    return Math.round((1000 * (row.membershipMix[group] ?? 0)) / total) / 10;
  };
  return {
    labels: years.map((y) => String(y.year)),
    datasets: membershipGroups(c).map((g) => ({
      label: g.key,
      data: years.map((y) => share(y, g.key)),
      borderColor: g.color,
      backgroundColor: g.color,
      borderWidth: g.width,
      pointRadius: 0,
      tension: 0.3,
    })),
  };
}

function membershipOptions(c: ChartColors): ChartOptions<"line"> {
  return {
    ...percentLine(c),
    plugins: { legend: { display: true } },
  };
}

export function StorySection() {
  const testMode = import.meta.env.MODE === "test";
  const colors = useChartColors();
  const byId = {
    growth: growthChapter(),
    seasons: seasonsChapter(),
    pandemic: pandemicChapter(),
    ebikes: ebikeChapter(),
    weather: weatherChapter(),
    purpose: purposeChapter(),
    membership: membershipChapter(),
  };

  const charts: Record<string, React.ReactNode> = testMode
    ? {}
    : {
        growth: (
          <ChartReveal>
            <Line data={growthData(colors)} options={quietLine(colors)} />
          </ChartReveal>
        ),
        seasons: (
          <ChartReveal>
            <Line data={seasonsData(colors)} options={quietLine(colors)} />
          </ChartReveal>
        ),
        pandemic: (
          <ChartReveal>
            <Line data={pandemicData(colors)} options={quietLine(colors)} />
          </ChartReveal>
        ),
        ebikes: (
          <ChartReveal>
            <Line data={ebikeData(colors)} options={percentLine(colors)} />
          </ChartReveal>
        ),
        purpose: (
          <ChartReveal>
            <Bar data={purposeData(colors)} options={purposeOptions(colors)} />
          </ChartReveal>
        ),
        weather: (
          <ChartReveal>
          <Bar
            data={weatherData(colors)}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: {
                  title: { display: true, text: "trips per day" },
                  grid: { color: colors.grid },
                  ticks: {
                    callback: (v: string | number) => Number(v).toLocaleString("en-CA"),
                  },
                },
              },
            }}
          />
          </ChartReveal>
        ),
        membership: (
          <ChartReveal>
            <Line data={membershipData(colors)} options={membershipOptions(colors)} />
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
                className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.02em] text-foreground sm:text-5xl"
              >
                {content.headline}
              </h3>
              <div
                className="mt-10 h-64 min-w-0 sm:h-80"
                role="img"
                aria-label={content.caption}
              >
                {testMode ? (
                  <div
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
