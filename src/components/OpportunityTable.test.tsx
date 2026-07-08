import { render, screen } from "@testing-library/react";
import { OpportunityTable } from "@/components/OpportunityTable";
import { opportunities } from "@/data/opportunities";

describe("OpportunityTable", () => {
  it("renders the table", () => {
    render(<OpportunityTable />);

    expect(screen.getByText("Opportunity ranking")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Rank" })).toBeInTheDocument();
  });

  it("renders opportunity rows", () => {
    render(<OpportunityTable />);

    for (const opportunity of opportunities) {
      expect(screen.getByText(`#${opportunity.rank}`)).toBeInTheDocument();
      expect(screen.getByText(opportunity.reason)).toBeInTheDocument();
    }
  });

  it("renders priority badges", () => {
    render(<OpportunityTable />);

    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Medium").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Low").length).toBeGreaterThan(0);
  });

  it("renders an empty state", () => {
    render(<OpportunityTable opportunities={[]} />);

    expect(screen.getByText("No opportunities ranked yet")).toBeInTheDocument();
  });
});
