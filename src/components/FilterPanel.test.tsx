import { useState } from "react";
import { render, screen } from "@testing-library/react";
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

    for (const label of ["Day type", "Time of day", "Bike type", "Transit distance"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("lets users change filter values", async () => {
    render(<FilterPanelHarness />);

    await chooseOption("Day type", "Weekend");

    expect(screen.getByRole("combobox", { name: "Day type" })).toHaveTextContent(
      "Weekend",
    );
  });

  it("resets filters to defaults", async () => {
    const user = userEvent.setup();
    render(<FilterPanelHarness />);

    await chooseOption("Day type", "Weekend");
    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByRole("combobox", { name: "Day type" })).toHaveTextContent(
      "All",
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
});
