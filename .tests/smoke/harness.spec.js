// .tests/smoke/harness.spec.js
// Baseline harness smoke test.
// Verifies: server starts (TEST-02), app loads and CDI fires (TEST-03),
// no root package.json (TEST-01), clean browser state / no cookie modal (TEST-04).
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('app boots and CDI initialises (TEST-02, TEST-03)', async ({ page }) => {
  await page.goto('/');
  // Wait for CDI readiness signal — replaces arbitrary timeouts
  await page.waitForSelector('[data-app-ready]');
  await expect(page.locator('body')).toHaveAttribute('data-app-ready', '1');
});

test('no root-level package.json exists (TEST-01)', async () => {
  const rootPkgJson = path.join(__dirname, '..', '..', 'package.json');
  expect(fs.existsSync(rootPkgJson)).toBe(false);
});

test('cookie consent modal is not visible on load (TEST-04)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  // storageState from globalSetup means consent already accepted
  // The modal must not be visible
  const modal = page.locator('#cookieModal');
  await expect(modal).not.toBeVisible();
});
