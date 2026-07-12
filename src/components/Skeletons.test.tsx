import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartSkeleton, MapSkeleton, TableSkeleton } from "@/components/Skeletons";

describe("skeletons", () => {
  it("ChartSkeleton is a ghost bar chart hidden from assistive tech", () => {
    const { container } = render(<ChartSkeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    // Ghost columns + axis-label ghosts, all built from the pulse primitive.
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("MapSkeleton renders and is hidden from assistive tech", () => {
    const { container } = render(<MapSkeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("TableSkeleton renders one ghost card per requested row", () => {
    const { container } = render(<TableSkeleton rows={3} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("ul > li")).toHaveLength(3);
  });
});
