import { render, screen } from "@testing-library/react";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";

function Bomb(): never {
  throw new Error("style is not done loading");
}

describe("MapErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <MapErrorBoundary>
        <p>the map</p>
      </MapErrorBoundary>,
    );
    expect(screen.getByText("the map")).toBeInTheDocument();
  });

  it("contains a crashing map instead of blanking the page", () => {
    // React logs the caught error; keep the test output quiet.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MapErrorBoundary>
        <Bomb />
      </MapErrorBoundary>,
    );
    spy.mockRestore();

    expect(screen.getByText("The map hit an error.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
