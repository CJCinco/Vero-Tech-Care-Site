const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    browserName: "chromium",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "webkit-ipad-checkin",
      grep: /direct-only workshop check-in|workshop setup/,
      use: {
        ...devices["iPad (gen 7) landscape"],
        browserName: "webkit"
      }
    }
  ]
});
