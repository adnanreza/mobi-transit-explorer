import { Bar, Line } from "react-chartjs-2";
import { useChartColors } from "@/components/charts/chartTheme";

type MiniTrendChartProps = {
  data: number[];
  labels?: string[];
  type?: "line" | "bar";
  color?: string;
  ariaLabel: string;
};

export function MiniTrendChart({
  data,
  labels,
  type = "line",
  color,
  ariaLabel,
}: MiniTrendChartProps) {
  // Defaults to the theme accent; axes and tooltips are hidden here, so a
  // dataset-color update on re-render is enough — no remount needed.
  const themeColor = useChartColors().blue;
  const resolvedColor = color ?? themeColor;

  if (import.meta.env.MODE === "test") {
    return <canvas className="h-7 w-24" role="img" aria-label={ariaLabel} />;
  }

  const chartData = {
    labels: labels ?? data.map((_, index) => String(index + 1)),
    datasets: [
      {
        data,
        borderColor: resolvedColor,
        backgroundColor: withAlpha(resolvedColor, type === "bar" ? 0.28 : 0.16),
        borderWidth: 2,
        borderRadius: 4,
        fill: type === "line",
        pointRadius: 0,
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: true },
    },
  };

  const Chart = type === "bar" ? Bar : Line;

  return (
    <div className="h-7 w-24" aria-label={ariaLabel}>
      <Chart data={chartData} options={options} />
    </div>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
