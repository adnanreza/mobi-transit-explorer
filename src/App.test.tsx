import { render, screen } from "@testing-library/react";
import App from "@/App";

describe("App", () => {
  it("renders the app shell", () => {
    render(<App />);

    expect(
      screen.getByText("How bike share extends transit in Vancouver"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A front-end data product by Adnan Reza"),
    ).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Mobi Transit Explorer" }),
    ).toBeInTheDocument();
  });

  it("renders the nav items", () => {
    render(<App />);

    for (const item of ["Overview", "Map", "Opportunities", "Methodology"]) {
      expect(screen.getByRole("link", { name: item })).toBeInTheDocument();
    }
  });

  it("targets the correct sections from nav links", () => {
    render(<App />);

    for (const [label, href] of [
      ["Overview", "#overview"],
      ["Map", "#map"],
      ["Opportunities", "#opportunities"],
      ["Methodology", "#methodology"],
    ]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
      expect(document.querySelector(href)).toBeInTheDocument();
    }
  });

  it("renders key accessible controls and buttons", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Month" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Transit distance" })).toBeInTheDocument();
  });

  it("renders important section headings", () => {
    render(<App />);

    for (const heading of ["Overview", "Map", "Opportunities", "Methodology"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });
});
