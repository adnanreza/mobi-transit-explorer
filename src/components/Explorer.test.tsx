import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Explorer } from "@/components/Explorer";
import { stationsAll } from "@/data";

async function chooseOption(label: string, option: string) {
  const user = userEvent.setup();

  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

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

  it("selecting a station through the finder updates the detail panel", async () => {
    render(<Explorer />);
    await screen.findByLabelText("Interactive map of Mobi stations");

    await chooseOption("Find a station", stationsAll[0].name);

    expect(
      screen.getByRole("heading", { name: stationsAll[0].name }),
    ).toBeInTheDocument();
  });

  it("changing filters updates displayed filter state", async () => {
    render(<Explorer />);

    await chooseOption("Day type", "Weekend");

    expect(screen.getByText("Weekend days")).toBeInTheDocument();
  });

  it("reset filters works", async () => {
    const user = userEvent.setup();
    render(<Explorer />);

    await chooseOption("Day type", "Weekend");
    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByText("All days")).toBeInTheDocument();
  });
});
