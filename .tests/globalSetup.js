// .tests/globalSetup.js
const { chromium } = require('@playwright/test');
const { registerCdnRoutes } = require('./fixtures/cdn-routes.js');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup(config) {
  const authDir = path.join(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Register CDN intercepts — same fixtures as per-test cdn.js.
  // Also strips integrity attributes from index.html so local fixture files
  // pass SRI checks in this raw browser context.
  await registerCdnRoutes(page);

  await page.goto('http://localhost:8080');
  // Wait for CDI initialisation — requires data-app-ready from main.js
  await page.waitForSelector('[data-app-ready]', { timeout: 30000 });

  // App auto-initialises on first visit — M009 schema uses 'dev' key
  // (pre-M009 used '0' — kept as fallback for any legacy path)
  await page.waitForFunction(() =>
    localStorage.getItem('dev') !== null || localStorage.getItem('0') !== null
  );

  // Save full browser state: localStorage
  await context.storageState({
    path: path.join(authDir, 'consent.json'),
  });

  await browser.close();
};
