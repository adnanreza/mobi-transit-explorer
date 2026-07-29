import { render, screen } from "@testing-library/react";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { crashContext, stations, stationsAll } from "@/data";

const station = stations[0];

describe("StationDetailPanel", () => {
  it("renders an empty state", () => {
    render(<StationDetailPanel station={null} />);

    expect(screen.getByText("Select a station")).toBeInTheDocument();
  });

  it("renders selected station details", () => {
    render(<StationDetailPanel station={station} />);

    expect(screen.getByRole("heading", { name: station.name })).toBeInTheDocument();
    expect(screen.getByText(station.area)).toBeInTheDocument();
    expect(screen.getByText(station.monthlyTrips.toLocaleString("en-CA"))).toBeInTheDocument();
  });

  it("renders top destinations", () => {
    render(<StationDetailPanel station={station} />);

    for (const destination of station.topDestinations) {
      expect(screen.getAllByText(destination).length).toBeGreaterThan(0);
    }
  });

  it("renders score progress", () => {
    render(<StationDetailPanel station={station} />);

    expect(screen.getByLabelText("Transit connector score")).toBeInTheDocument();
    expect(screen.getByText(`${station.connectorScore}/100`)).toBeInTheDocument();
  });

  it("renders crash context as a full sentence with count, radius, years, and casualties", () => {
    render(<StationDetailPanel station={station} />);

    const entry = crashContext.byStation[station.id];
    expect(entry.crashes).toBeGreaterThan(0); // fixture is the busiest station
    const { from, to } = crashContext.vintage;
    // The whole sentence, not a prefix: a wrong casualty number, a hardcoded
    // year, or a dropped vintage must all fail here.
    expect(
      screen.getByText(
        `${entry.crashes.toLocaleString("en-CA")} cyclist-involved crashes reported within ` +
          `${crashContext.radiusM} m, ${from} to ${to} ` +
          `(${entry.casualtyCrashes.toLocaleString("en-CA")} casualty crashes).`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/so the count is a floor/)).toBeInTheDocument();
    expect(screen.getByText(/all cyclists rather than Mobi riders/)).toBeInTheDocument();
    expect(screen.getByText(/Not a station-to-station\s+risk comparison/)).toBeInTheDocument();
  });

  it("renders an explicit zero state so none-reported cannot read as unmeasured", () => {
    const zero = stationsAll.find((s) => crashContext.byStation[s.id]?.crashes === 0);
    if (!zero) throw new Error("no zero-crash station in the artifact");
    render(<StationDetailPanel station={zero} />);

    const { from, to } = crashContext.vintage;
    expect(
      screen.getByText(
        `No cyclist-involved crashes reported within ${crashContext.radiusM} m, ${from} to ${to}.`,
      ),
    ).toBeInTheDocument();
  });

  it("distinguishes a dock the crash artifact does not cover from a measured zero", () => {
    // A station absent from byStation must say so rather than render nothing,
    // and must not borrow the zero-state wording.
    const uncovered = { ...station, id: "no-such-station" };
    render(<StationDetailPanel station={uncovered} />);

    const { from, to } = crashContext.vintage;
    expect(
      screen.getByText(`Crash data is not available for this dock, ${from} to ${to}.`),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No cyclist-involved crashes reported/)).toBeNull();
  });

  it("renders the station label badge", () => {
    render(<StationDetailPanel station={station} />);

    expect(screen.getByText(station.label)).toBeInTheDocument();
  });
});
