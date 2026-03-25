// Custom Playwright fixture that intercepts CDN requests and serves local files.
// All E2E specs should require this instead of '@playwright/test':
//   const { test, expect } = require('../fixtures/cdn');

const { test: base, expect } = require('@playwright/test');
const { registerCdnRoutes } = require('./cdn-routes.js');

const test = base.extend({
  page: async ({ page }, use) => {
    await registerCdnRoutes(page);
    await use(page);
  },
});

module.exports = { test, expect };
