import { render, screen } from "@testing-library/react";
import { FlowsSection } from "@/components/flows/FlowsSection";
import { flows } from "@/data";

describe("FlowsSection", () => {
  it("renders the implied rebalancing headline from data", () => {
    render(<FlowsSection />);

    // The headline is split into text nodes; match the inferred count by regex
    expect(
      screen.getByText(
        new RegExp(
          `estimated ${flows.networkDailyRebalancing.toLocaleString("en-CA")} bikes a day`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("renders both ranked lists", () => {
    render(<FlowsSection />);

    expect(screen.getByText("Filling up on weekday mornings")).toBeInTheDocument();
    expect(screen.getByText("Draining on weekday evenings")).toBeInTheDocument();
  });

  it("renders the station flow explorer with day-type toggle", () => {
    render(<FlowsSection />);

    expect(screen.getByLabelText("Station flow chart")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weekdays" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Weekends" })).toBeInTheDocument();
  });
});
