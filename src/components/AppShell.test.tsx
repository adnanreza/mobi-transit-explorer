import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/AppShell";

describe("AppShell", () => {
  it("renders children inside the shell", () => {
    render(
      <AppShell navItems={[{ label: "Overview", href: "#overview" }]}>
        <p>Shell child content</p>
      </AppShell>,
    );

    expect(screen.getByText("Shell child content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "#overview",
    );
  });

  it("marks clicked nav items active", async () => {
    render(
      <AppShell navItems={[{ label: "Map", href: "#map" }]}>
        <section id="map">Map section</section>
      </AppShell>,
    );

    const link = screen.getByRole("link", { name: "Map" });
    link.click();

    expect(link).toHaveAttribute("aria-current", "page");
  });
});
