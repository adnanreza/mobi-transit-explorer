import { render, screen } from "@testing-library/react";
import { Methodology } from "@/components/Methodology";
import { airquality, crashContext, sourceSpanLabel } from "@/data";
import { meta } from "@/data";

describe("Methodology", () => {
  it("renders the case-study sections", () => {
    render(<Methodology />);

    const driftHeading = `${sourceSpanLabel[0].toUpperCase()}${sourceSpanLabel.slice(1)} of drift`;
    for (const heading of [
      "The data",
      "The pipeline",
      "When a new month lands",
      driftHeading,
      "Data quality",
      "Scores and rules",
      "Air quality",
      "Crash context",
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

  it("reproduces the OGL-BC attribution and derives the air-quality facts", () => {
    render(<Methodology />);

    // Same compliance rule as ICBC: the attribution statement must appear
    // verbatim (the literal string is pinned in generated.test.ts).
    expect(
      screen.getByText(new RegExp(escapeRegExp(airquality.licence.attribution))),
    ).toBeInTheDocument();
    // The threshold and verified-through year render from the artifact, so
    // the next BC ENV vintage updates this paragraph by itself.
    expect(
      screen.getByText(new RegExp(`exceed ${airquality.smokeThresholdUgM3} ug/m3`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`verified\\s+readings through ${airquality.verifiedThrough.slice(0, 4)}`),
      ),
    ).toBeInTheDocument();
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
