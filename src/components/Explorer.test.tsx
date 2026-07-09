import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Explorer } from "@/components/Explorer";
import { stationsByMonth } from "@/data/stations";

const aprilStations = stationsByMonth["april-2026"];

async function chooseOption(label: string, option: string) {
  const user = userEvent.setup();

  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("Explorer", () => {
  it("renders filters, map, and detail panel", () => {
    render(<Explorer />);

    expect(screen.getByText("Filter real trip metrics")).toBeInTheDocument();
    expect(screen.getByText("Mobility map")).toBeInTheDocument();
    expect(screen.getByText("Select a station")).toBeInTheDocument();
  });

  it("selecting a station updates the detail panel", async () => {
    const user = userEvent.setup();
    render(<Explorer />);

    await user.click(
      screen.getByRole("button", {
        name: `${aprilStations[0].name}, connector score ${aprilStations[0].connectorScore}`,
      }),
    );

    expect(
      screen.getByRole("heading", { name: aprilStations[0].name }),
    ).toBeInTheDocument();
  });

  it("changing filters updates displayed filter state", async () => {
    render(<Explorer />);

    await chooseOption("Month", "May 2026");

    expect(screen.getByText("Showing May 2026")).toBeInTheDocument();
  });

  it("reset filters works", async () => {
    const user = userEvent.setup();
    render(<Explorer />);

    await chooseOption("Month", "May 2026");
    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByText("Showing April 2026")).toBeInTheDocument();
  });
});
