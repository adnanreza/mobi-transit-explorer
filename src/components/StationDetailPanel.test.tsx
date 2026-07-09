import { render, screen } from "@testing-library/react";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { stations } from "@/data/stations";

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

  it("renders the station label badge", () => {
    render(<StationDetailPanel station={station} />);

    expect(screen.getByText(station.label)).toBeInTheDocument();
  });
});
