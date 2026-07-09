import { Bar, Line } from "react-chartjs-2";
import "@/components/charts/chartSetup";

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
  color = "#008fd3",
  ariaLabel,
}: MiniTrendChartProps) {
  if (import.meta.env.MODE === "test") {
    return <canvas className="h-7 w-24" role="img" aria-label={ariaLabel} />;
  }

  const chartData = {
    labels: labels ?? data.map((_, index) => String(index + 1)),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: withAlpha(color, type === "bar" ? 0.28 : 0.16),
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
