import { render, screen } from "@testing-library/react";
import { FeatureStatusBadge, type FeatureStatus } from "@/components/FeatureStatusBadge";

describe("FeatureStatusBadge", () => {
  it.each([
    ["live", "Live foundation"],
    ["sample", "Sample data"],
    ["planned", "Planned feature"],
    ["future", "Future integration"],
  ] satisfies Array<[FeatureStatus, string]>)(
    "renders the %s status label",
    (status, label) => {
      render(<FeatureStatusBadge status={status} />);

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );
});
