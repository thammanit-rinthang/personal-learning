import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    storageState: "e2e/.auth/learner.json",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], viewport: { width: 360, height: 800 } } },
    { name: "tablet", use: { ...devices["iPad Mini"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 900 } } },
    { name: "wide", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 3001",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
