import { render, screen } from "@testing-library/react";
import { OverviewCards } from "@/components/OverviewCards";
import { overviewMetrics } from "@/data/metrics";

describe("OverviewCards", () => {
  it("renders all metric cards", () => {
    render(<OverviewCards />);

    for (const metric of overviewMetrics) {
      expect(screen.getByText(metric.label)).toBeInTheDocument();
    }
  });

  it("renders metric values", () => {
    render(<OverviewCards />);

    for (const metric of overviewMetrics) {
      expect(screen.getByText(metric.value)).toBeInTheDocument();
    }
  });

  it("renders metric captions", () => {
    render(<OverviewCards />);

    for (const metric of overviewMetrics) {
      expect(screen.getByText(metric.caption)).toBeInTheDocument();
    }
  });

  it("handles empty metric data", () => {
    render(<OverviewCards metrics={[]} />);

    expect(screen.getByText("Overview metrics unavailable")).toBeInTheDocument();
  });
});
