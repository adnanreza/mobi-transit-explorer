import { render, screen } from "@testing-library/react";
import { Methodology } from "@/components/Methodology";
import { crashContext } from "@/data";
import { meta } from "@/data";

describe("Methodology", () => {
  it("renders the case-study sections", () => {
    render(<Methodology />);

    for (const heading of [
      "The data",
      "The pipeline",
      "Nine and a half years of drift",
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

  it("reproduces both required ICBC licence texts verbatim", () => {
    render(<Methodology />);

    // Licence conditions, not prose: these must appear exactly, including the
    // U+2019 apostrophe, or the site is out of compliance.
    expect(screen.getByText(new RegExp(escapeRegExp(crashContext.licence.attribution)))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(escapeRegExp(crashContext.licence.disclaimer)))).toBeInTheDocument();
  });

  it("renders the crash context section with its radius sensitivity", () => {
    render(<Methodology />);

    expect(screen.getByRole("heading", { name: "Crash context" })).toBeInTheDocument();
    for (const row of crashContext.radiusSensitivity) {
      expect(
        screen.getByText(new RegExp(`${row.radiusM} m matches`)),
      ).toBeInTheDocument();
    }
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
