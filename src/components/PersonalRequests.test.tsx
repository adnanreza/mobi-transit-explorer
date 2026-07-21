import { render, screen } from "@testing-library/react";
import { PersonalRequests } from "@/components/PersonalRequests";

describe("PersonalRequests", () => {
  it("renders the three asks", () => {
    render(<PersonalRequests />);

    expect(screen.getByText("Bring the network south")).toBeInTheDocument();
    expect(screen.getByText("Send e-bikes with it")).toBeInTheDocument();
    expect(screen.getByText("Price e-bikes for commuters")).toBeInTheDocument();
  });

  it("annotations derive from the data, not hardcoded copy", () => {
    render(<PersonalRequests />);

    // Southernmost docks come from station coordinates.
    expect(screen.getByText(/Southernmost docks today:/)).toBeInTheDocument();
    // E-bike share and corporate share carry real percentages and years.
    expect(screen.getByText(/\d+% of \d{4} trips are electric/)).toBeInTheDocument();
    expect(
      screen.getByText(/Corporate passes carried \d+% of \d{4} trips/),
    ).toBeInTheDocument();
  });

  it("labels the section as personal, not rule-derived", () => {
    render(<PersonalRequests />);

    expect(
      screen.getByText(/these aren't rules over the data/),
    ).toBeInTheDocument();
  });
});
