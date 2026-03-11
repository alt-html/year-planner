// .tests/globalSetup.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup(config) {
  const authDir = path.join(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:8080');
  // Wait for CDI initialisation — requires data-app-ready from Application.js
  await page.waitForSelector('[data-app-ready]');

  // Accept cookie consent modal
  // Selector from index.html line 232: stable attribute-based, not text-based
  await page.click('#cookieModal .btn-secondary[data-dismiss="modal"]');

  // Wait for cookie '0' to be set (set by storageLocal.setLocalIdentities() in initialise())
  await page.waitForFunction(() => document.cookie.includes('0='));

  // Save full browser state: cookies + localStorage
  await page.context().storageState({
    path: path.join(authDir, 'consent.json'),
  });

  await browser.close();
};
