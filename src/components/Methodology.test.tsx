import { render, screen } from "@testing-library/react";
import { Methodology } from "@/components/Methodology";

describe("Methodology", () => {
  it("renders the methodology section", () => {
    render(<Methodology />);

    expect(screen.getByText("Data sources")).toBeInTheDocument();
  });

  it("renders key methodology headings", () => {
    render(<Methodology />);

    for (const heading of [
      "Data sources",
      "Connector score",
      "Limitations",
      "Future version",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("renders limitations", () => {
    render(<Methodology />);

    expect(
      screen.getByText("Public trip data is anonymized and cannot identify individual riders."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The MVP does not know exact route paths between stations."),
    ).toBeInTheDocument();
  });
});
