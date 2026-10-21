import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 3,
  timeout: 30000,
  expect: { timeout: 7000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    colorScheme: "light",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: "firefox-desktop",
      testIgnore: "**/resilience.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: "webkit-desktop",
      testIgnore: "**/resilience.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: "chromium-tablet",
      testIgnore: "**/resilience.spec.ts",
      use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" },
    },
    {
      name: "chromium-phone",
      testIgnore: "**/resilience.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "webkit-phone",
      testIgnore: "**/resilience.spec.ts",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
