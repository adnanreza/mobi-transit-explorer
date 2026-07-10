import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeatherModelBlock } from "@/components/story/WeatherModelBlock";
import { forecast } from "@/data";

describe("WeatherModelBlock", () => {
  it("renders a prediction from the grid for the default day", () => {
    render(<WeatherModelBlock />);

    const expected = forecast.grid[6][1][forecast.tempBandsC.indexOf(22)][0];
    expect(
      screen.getByText(`≈ ${expected.toLocaleString("en-CA")}`),
    ).toBeInTheDocument();
  });

  it("more rain never increases the prediction", async () => {
    const user = userEvent.setup();
    render(<WeatherModelBlock />);

    const dry = forecast.grid[6][1][forecast.tempBandsC.indexOf(22)][0];
    await user.click(screen.getByRole("combobox", { name: "Rain" }));
    await user.click(await screen.findByRole("option", { name: "Pouring (25 mm)" }));
    const pouring = forecast.grid[6][1][forecast.tempBandsC.indexOf(22)][3];

    expect(pouring).toBeLessThanOrEqual(dry);
    expect(
      screen.getByText(`≈ ${pouring.toLocaleString("en-CA")}`),
    ).toBeInTheDocument();
  });

  it("shows the honest model card", () => {
    render(<WeatherModelBlock />);

    expect(screen.getByText(/seasonal-naive/)).toBeInTheDocument();
    expect(screen.getByText(/not causal claims/)).toBeInTheDocument();
  });
});
