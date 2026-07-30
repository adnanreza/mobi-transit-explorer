import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    // e2e/ is Playwright's (npm run test:e2e), not Vitest's.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
    // These are behaviour tests, not performance tests. Several files mount
    // components that pull the whole generated-data layer or lazy-load
    // MapLibre, and on a busy machine a cold worker can spend seconds on the
    // transform alone: the 5s default produced failures that moved from run
    // to run. A generous ceiling keeps a genuine hang failing while removing
    // the flake. Raised in spec 046 after per-test timeouts turned into
    // whack-a-mole across four files.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
