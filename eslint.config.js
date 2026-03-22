const globals = require("globals");

module.exports = [
  {
    ignores: [
      "vendor/**",
      "node_modules/**",
      "reports/**",
      "playwright-report/**",
      "test-results/**"
    ]
  },
  {
    files: ["assets/js/**/*.js", "templatemo-*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        $: "readonly",
        jQuery: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", {
        args: "none",
        caughtErrors: "none",
        ignoreRestSiblings: true
      }]
    }
  }
];
