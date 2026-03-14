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

  // App auto-initialises on first visit (writes identities to localStorage).
  // Wait for localStorage key '0' to be set (set by storageLocal.setLocalIdentities() in lifecycle refresh/initialise).
  await page.waitForFunction(() => localStorage.getItem('0') !== null);

  // Save full browser state: localStorage
  await page.context().storageState({
    path: path.join(authDir, 'consent.json'),
  });

  await browser.close();
};
