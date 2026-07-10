import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultFilters, FilterPanel, type FilterState } from "@/components/FilterPanel";
import { lastCompleteYear } from "@/data";

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
  it("renders the two honest filters", () => {
    render(<FilterPanelHarness />);

    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("Transit distance")).toBeInTheDocument();
  });

  it("offers every complete year plus the trailing window", async () => {
    const user = userEvent.setup();
    render(<FilterPanelHarness />);

    await user.click(screen.getByRole("combobox", { name: "Year" }));
    expect(
      await screen.findByRole("option", { name: "Trailing 12 months" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2017" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: String(lastCompleteYear) }),
    ).toBeInTheDocument();
  });

  it("changes and resets filter values", async () => {
    const user = userEvent.setup();
    render(<FilterPanelHarness />);

    await chooseOption("Year", "2019");
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2019");

    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent(
      "Trailing 12 months",
    );
  });

  it("passes filter state upward", async () => {
    const handleChange = vi.fn();
    render(<FilterPanelHarness onChange={handleChange} />);

    await chooseOption("Transit distance", "Within 300 m");

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultFilters,
      transitDistance: "300",
    });
  });
});
