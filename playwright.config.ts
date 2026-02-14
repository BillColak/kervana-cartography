import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        "/home/bill/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome",
    },
  },
  webServer: {
    command: "bun run dev --port 5173",
    port: 5173,
    timeout: 15000,
    reuseExistingServer: true,
  },
});
