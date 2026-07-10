import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Explorer } from "@/components/Explorer";
import { stations } from "@/data";

async function chooseOption(label: string, option: string) {
  const user = userEvent.setup();

  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("Explorer", () => {
  it("renders filters, map, and detail panel", () => {
    render(<Explorer />);

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Mobility map")).toBeInTheDocument();
    expect(screen.getByText("Select a station")).toBeInTheDocument();
  });

  it("selecting a station updates the detail panel", async () => {
    const user = userEvent.setup();
    render(<Explorer />);

    await user.click(
      screen.getByRole("button", {
        name: `${stations[0].name}, connector score ${stations[0].connectorScore}`,
      }),
    );

    expect(
      screen.getByRole("heading", { name: stations[0].name }),
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
