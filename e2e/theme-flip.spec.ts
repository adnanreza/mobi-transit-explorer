import { expect, test } from "playwright/test";

// Spec 043 regression: flipping the theme rebuilds the map with the other
// basemap style, and the mode-paint effect used to fire against the new,
// style-still-loading instance — "Style is not done loading" threw, React
// unmounted the tree (contained to the boundary since 043), and the map
// died. The fix gates painting on the layers actually existing; this test
// replays the crash sequence against the production bundle, where the real
// MapLibre code path runs. Proven by mutation in spec 047: disabling the
// paintedLayersReady guard makes it fail (boundary fallback + no canvas).
test("theme flips during the style load do not blank the page", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map").scrollIntoViewIfNeeded();
  // The canvas exists from Map construction, BEFORE the style loads, and the
  // race only arms once the first style has finished (loaded === true). The
  // attribution text comes from the style's sources, so it is the DOM signal
  // that the load handler has run. Flipping earlier tests nothing.
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".maplibregl-ctrl-attrib")).toContainText(
    "OpenStreetMap",
    { timeout: 30_000 },
  );

  const textBefore = (await page.locator("body").innerText()).length;
  expect(textBefore).toBeGreaterThan(5_000);

  // First flip fires the paint effect against the new, style-still-loading
  // map (the 043 crash). The immediate second click lands inside that
  // style's load window; the third catches a half-settled state.
  const toggle = page.getByRole("button", { name: "Dark theme" });
  await toggle.click();
  await toggle.click();
  await page.waitForTimeout(200);
  await toggle.click();
  await page.waitForTimeout(3_000);

  // The page survived: no boundary fallback, a live canvas, content intact.
  await expect(page.getByText("The map hit an error.")).toHaveCount(0);
  await expect(page.locator(".maplibregl-canvas").first()).toBeVisible();
  const textAfter = (await page.locator("body").innerText()).length;
  expect(textAfter).toBeGreaterThan(textBefore * 0.9);
});
