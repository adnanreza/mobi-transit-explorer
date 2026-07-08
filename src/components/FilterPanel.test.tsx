import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultFilters, FilterPanel, type FilterState } from "@/components/FilterPanel";

function FilterPanelHarness({
  onChange,
}: {
  onChange?: (filters: FilterState) => void;
}) {
  const [filters, setFilters] = useState(defaultFilters);

  return (
    <FilterPanel
      filters={filters}
      onFiltersChange={(nextFilters) => {
        setFilters(nextFilters);
        onChange?.(nextFilters);
      }}
    />
  );
}

async function chooseOption(label: string, option: string) {
  const user = userEvent.setup();

  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("FilterPanel", () => {
  it("renders filter labels", () => {
    render(<FilterPanelHarness />);

    for (const label of [
      "Month",
      "Day type",
      "Time of day",
      "Bike type",
      "Transit distance",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("lets users change filter values", async () => {
    render(<FilterPanelHarness />);

    await chooseOption("Month", "May 2026");

    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent(
      "May 2026",
    );
  });

  it("resets filters to defaults", async () => {
    const user = userEvent.setup();
    render(<FilterPanelHarness />);

    await chooseOption("Month", "May 2026");
    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent(
      "April 2026",
    );
  });

  it("passes filter state upward", async () => {
    const handleChange = vi.fn();
    render(<FilterPanelHarness onChange={handleChange} />);

    await chooseOption("Bike type", "E-bike");

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultFilters,
      bikeType: "e-bike",
    });
  });

  it("shows selected filter summary", () => {
    render(<FilterPanelHarness />);

    const panel = screen.getByText("Filter sample trips").closest("div");
    expect(panel).not.toBeNull();
    expect(within(document.body).getAllByText("April 2026").length).toBeGreaterThan(0);
  });
});
