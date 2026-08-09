import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser/playwright",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "line",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "node tests/support/fixture-server.mjs",
    url: "http://127.0.0.1:4173/healthz",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
