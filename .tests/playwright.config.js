// .tests/playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  globalSetup: require.resolve('./globalSetup.js'),
  globalTeardown: require.resolve('./globalTeardown.js'),
  webServer: {
    command: 'npx http-server ../site -p 8080 -c-1',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  use: {
    baseURL: 'http://localhost:8080',
    storageState: '.auth/consent.json',
  },
  testDir: '.',
  reporter: 'list',
});
