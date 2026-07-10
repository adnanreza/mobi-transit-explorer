// One chart voice for the whole app: near-monochrome ink with the single
// Mobi-blue accent, hairline grids, quiet tooltips. Import once anywhere
// charts render (chartSetup registers the controllers; this sets the tone).

import { Chart as ChartJS } from "chart.js";
import "@/components/charts/chartSetup";

export const chartColors = {
  blue: "#008fd3",
  blueSoft: "rgba(0, 143, 211, 0.10)",
  ink: "#0f172a",
  gray: "#cbd5e1",
  grayStrong: "#94a3b8",
  graySoft: "rgba(148, 163, 184, 0.08)",
  grid: "rgba(148, 163, 184, 0.16)",
  label: "#6b7280",
};

ChartJS.defaults.font.family =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Inter, ui-sans-serif, system-ui, sans-serif';
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = chartColors.label;
ChartJS.defaults.borderColor = chartColors.grid;

ChartJS.defaults.plugins.legend.position = "bottom";
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
ChartJS.defaults.plugins.legend.labels.boxHeight = 10;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = "circle";

ChartJS.defaults.plugins.tooltip.backgroundColor = "#ffffff";
ChartJS.defaults.plugins.tooltip.titleColor = chartColors.ink;
ChartJS.defaults.plugins.tooltip.bodyColor = chartColors.label;
ChartJS.defaults.plugins.tooltip.borderColor = "rgba(148, 163, 184, 0.4)";
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.displayColors = false;

// Charts draw themselves over ~900ms when they enter the viewport (see
// ChartReveal); under reduced motion they render complete on first paint.
const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

ChartJS.defaults.animation = prefersReducedMotion
  ? (false as unknown as typeof ChartJS.defaults.animation)
  : ({ duration: 900, easing: "easeOutQuart" } as typeof ChartJS.defaults.animation);
