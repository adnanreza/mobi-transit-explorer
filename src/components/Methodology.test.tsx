import { render, screen } from "@testing-library/react";
import { Methodology } from "@/components/Methodology";
import { meta } from "@/data";

describe("Methodology", () => {
  it("renders the case-study sections", () => {
    render(<Methodology />);

    for (const heading of [
      "The data",
      "The pipeline",
      "Nine years of drift",
      "Data quality",
      "Scores and rules",
      "What this data cannot say",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("surfaces generated pipeline numbers, not hand-written ones", () => {
    render(<Methodology />);

    expect(
      screen.getAllByText(new RegExp(meta.quality.rowsLanded.toLocaleString("en-CA"))).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(meta.quality.rowsKept.toLocaleString("en-CA"))).length,
    ).toBeGreaterThan(0);
  });

  it("links to the committed data-quality report", () => {
    render(<Methodology />);

    expect(
      screen.getByRole("link", { name: "the data-quality report" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("docs/data-quality-report.md"),
    );
  });

  it("keeps the honest limitations", () => {
    render(<Methodology />);

    expect(screen.getByText(/association, not cause/)).toBeInTheDocument();
  });
});
