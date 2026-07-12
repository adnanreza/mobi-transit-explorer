import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Explorer } from "@/components/Explorer";
import { stationsAll, stationsArtifact } from "@/data";

async function chooseOption(label: string, option: string) {
  const user = userEvent.setup();

  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

afterEach(() => {
  window.history.replaceState(null, "", window.location.pathname);
});

describe("Explorer", () => {
  it("renders finder, filters, map, and detail panel", async () => {
    render(<Explorer />);

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Find a station")).toBeInTheDocument();
    expect(screen.getByText("Select a station")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Interactive map of Mobi stations"),
    ).toBeInTheDocument();
  });

  it("selecting a station through the finder updates the detail panel and URL", async () => {
    render(<Explorer />);
    await screen.findByLabelText("Interactive map of Mobi stations");

    await chooseOption("Find a station", stationsAll[0].name);

    expect(
      screen.getByRole("heading", { name: stationsAll[0].name }),
    ).toBeInTheDocument();
    expect(window.location.search).toContain(`station=${stationsAll[0].id}`);
  });

  it("restores state from the URL", async () => {
    // Use a station that is within 300 m of transit AND has 2019 trips, so the
    // selection is not cleared by the active filter when state is restored.
    const inSlice = stationsArtifact.stations.find(
      (s) => s.nearestTransit.distanceM <= 300 && (s.tripsByYear["2019"] ?? 0) > 0,
    );
    if (!inSlice) throw new Error("No fixture station within 300 m with 2019 trips");
    const station = stationsAll.find((s) => s.id === inSlice.id)!;

    window.history.replaceState(
      null,
      "",
      `?station=${station.id}&year=2019&transit=300`,
    );
    render(<Explorer />);

    expect(
      await screen.findByRole("heading", { name: station.name }),
    ).toBeInTheDocument();
    expect(screen.getByText("Showing 2019 trip volume · station details are trailing 12 months")).toBeInTheDocument();
    expect(
      screen.getByText("within 300 m of rapid transit"),
    ).toBeInTheDocument();
  });

  it("changing the year filter updates the scope line and URL", async () => {
    render(<Explorer />);

    await chooseOption("Year", "2021");

    expect(screen.getByText("Showing 2021 trip volume · station details are trailing 12 months")).toBeInTheDocument();
    expect(window.location.search).toContain("year=2021");
  });

  it("reset returns to the trailing window", async () => {
    const user = userEvent.setup();
    render(<Explorer />);

    await chooseOption("Year", "2021");
    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByText(/Trailing 12 months to/)).toBeInTheDocument();
  });
});
