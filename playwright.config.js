const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/integration",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true
  },
  webServer: {
    command: "npm run serve",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  reporter: [
    ["list"],
    ["junit", { outputFile: "reports/playwright/results.xml" }]
  ]
});
