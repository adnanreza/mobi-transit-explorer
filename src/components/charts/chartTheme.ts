// One chart voice for the whole app: near-monochrome ink with a single
// restrained accent (the portfolio blue), hairline grids, mono caption
// labels, quiet tooltips — in both themes. Components call useChartColors()
// (or getChartColors) at render time; ChartReveal remounts charts when the
// theme flips so Chart.js re-reads the defaults set here.

import { Chart as ChartJS } from "chart.js";
import "@/components/charts/chartSetup";
import { useTheme, type Theme } from "@/lib/theme";

export type ChartColors = {
  blue: string; // accent — the one colored series
  blueSoft: string;
  ink: string;
  gray: string; // de-emphasized series
  grayStrong: string; // secondary series
  graySoft: string;
  faint: string; // the quietest series in a ramp
  grid: string;
  label: string;
  tooltipBg: string;
  tooltipBorder: string;
};

const palettes: Record<Theme, ChartColors> = {
  light: {
    blue: "#196ea9",
    blueSoft: "rgba(25, 110, 169, 0.10)",
    ink: "#090e11",
    gray: "#d4d8db",
    grayStrong: "#94999d",
    graySoft: "rgba(148, 153, 157, 0.08)",
    faint: "#e2e5e8",
    grid: "rgba(148, 153, 157, 0.16)",
    label: "#636a6f",
    tooltipBg: "#f1f4f6",
    tooltipBorder: "#d4d8db",
  },
  dark: {
    blue: "#5fa5de",
    blueSoft: "rgba(95, 165, 222, 0.12)",
    ink: "#ededed",
    gray: "#454545",
    grayStrong: "#959595",
    graySoft: "rgba(149, 149, 149, 0.08)",
    faint: "#2e2e2e",
    grid: "rgba(237, 237, 237, 0.08)",
    label: "#959595",
    tooltipBg: "#161616",
    tooltipBorder: "#2e2e2e",
  },
};

// Tick, legend, and axis-title text speak the portfolio's caption voice:
// JetBrains Mono, tiny.
ChartJS.defaults.font.family =
  '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
ChartJS.defaults.font.size = 10;

// Cap the canvas backing store at 2× regardless of the screen's real DPR.
// iOS Safari enforces a total canvas-memory budget across the page; on a
// dpr-3 iPhone, each canvas allocates width×height×9 bytes, and a page full
// of Chart.js canvases plus MapLibre's WebGL surface can blow past the cap,
// which Safari answers by dropping backing stores — the charts paint blank.
// A 2× cap cuts each backing store ~56% (9→4) and stays visually crisp.
ChartJS.defaults.devicePixelRatio = 2;

ChartJS.defaults.plugins.legend.position = "bottom";
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
ChartJS.defaults.plugins.legend.labels.boxHeight = 10;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = "circle";

ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.cornerRadius = 6;
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

let appliedTheme: Theme | null = null;

function applyDefaults(theme: Theme): void {
  if (appliedTheme === theme) return;
  appliedTheme = theme;
  const colors = palettes[theme];
  ChartJS.defaults.color = colors.label;
  ChartJS.defaults.borderColor = colors.grid;
  ChartJS.defaults.plugins.tooltip.backgroundColor = colors.tooltipBg;
  ChartJS.defaults.plugins.tooltip.titleColor = colors.ink;
  ChartJS.defaults.plugins.tooltip.bodyColor = colors.label;
  ChartJS.defaults.plugins.tooltip.borderColor = colors.tooltipBorder;
}

applyDefaults("light");

/** Returns the palette for a theme and syncs the Chart.js global defaults to
 *  it. Charts created after this call pick up the right label/tooltip tones;
 *  ChartReveal recreates live charts on theme change. */
export function getChartColors(theme: Theme): ChartColors {
  applyDefaults(theme);
  return palettes[theme];
}

/** Render-time hook: subscribes the component to theme changes and returns
 *  the active chart palette. */
export function useChartColors(): ChartColors {
  return getChartColors(useTheme());
}
