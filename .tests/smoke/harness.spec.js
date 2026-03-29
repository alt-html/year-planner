// .tests/smoke/harness.spec.js
// Baseline harness smoke test.
// Verifies: server starts (TEST-02), app loads and CDI fires (TEST-03),
// no root package.json (TEST-01), app auto-initialises without consent modal (TEST-04).
const { test, expect } = require('../fixtures/cdn');
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

test('app auto-initialises without consent modal (TEST-04)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  // No cookie consent modal should exist in the DOM
  const modal = page.locator('#cookieModal');
  await expect(modal).toHaveCount(0);
});

test('data-api-core HLC importable from vendor bundle (SYNC-01)', async ({ page }) => {
  // The app must already be running (webServer). Navigate to it.
  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');
  // Evaluate HLC in browser context
  const result = await page.evaluate(async () => {
    const { HLC } = await import('/js/vendor/data-api-core.esm.js');
    const clock = HLC.create('test-node', Date.now());
    const ticked = HLC.tick(clock, Date.now());
    return { clock, ticked, valid: typeof clock === 'string' && ticked > clock };
  });
  expect(result.valid).toBe(true);
});
