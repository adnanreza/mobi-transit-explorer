import { defineConfig } from "playwright/test";

// Browser regression tests for the failure classes jsdom cannot reach: the
// map is stubbed out under Vitest (import.meta.env.MODE === "test"), so the
// spec 043 theme-flip race is only reproducible against the real bundle.
// Run with: npm run build && npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // The suite asserts against the production build, like every visual check
  // in the spec docs.
  webServer: {
    // A dedicated port, never reused: 4173 is vite's default, and a preview
    // server from ANOTHER project sitting there once made this suite assert
    // against the wrong site entirely.
    command: "npm run preview -- --port 4189 --strictPort",
    url: "http://localhost:4189",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  use: {
    baseURL: "http://localhost:4189",
    browserName: "chromium",
  },
});
