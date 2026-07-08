import { render, screen } from "@testing-library/react";
import { SectionHeader } from "@/components/SectionHeader";

describe("SectionHeader", () => {
  it("renders section headings and descriptions", () => {
    render(
      <SectionHeader
        eyebrow="Overview"
        title="Transit access snapshot"
        description="A concise section description."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Transit access snapshot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A concise section description.")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});
