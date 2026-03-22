const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.js"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "reports/vitest/results.xml"
    },
    coverage: {
      provider: "v8",
      include: ["assets/js/app.js"],
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "reports/coverage"
    }
  }
});
