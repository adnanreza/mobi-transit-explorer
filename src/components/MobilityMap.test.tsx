import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobilityMap } from "@/components/MobilityMap";
import { stations, transitNodes } from "@/data";

describe("MobilityMap", () => {
  it("renders stations", () => {
    render(<MobilityMap />);

    expect(
      screen.getByRole("button", {
        name: `${stations[0].name}, connector score ${stations[0].connectorScore}`,
      }),
    ).toBeInTheDocument();
  });

  it("renders transit nodes", () => {
    render(<MobilityMap />);

    expect(
      screen.getByLabelText(`${transitNodes[0].name} transit node`),
    ).toBeInTheDocument();
  });

  it("calls selection handler when a station is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<MobilityMap onStationSelect={handleSelect} />);

    await user.click(
      screen.getByRole("button", {
        name: `${stations[0].name}, connector score ${stations[0].connectorScore}`,
      }),
    );

    expect(handleSelect).toHaveBeenCalledWith(stations[0]);
  });

  it("marks the selected station", () => {
    render(<MobilityMap selectedStationId={stations[0].id} />);

    expect(
      screen.getByRole("button", {
        name: `${stations[0].name}, connector score ${stations[0].connectorScore}`,
      }),
    ).toHaveAttribute("data-selected", "true");
  });
});
