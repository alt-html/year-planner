// E2E tests: Legacy share and feature-flag surface removal
// LSR-01: No share button in rail
// LSR-02: No shareModal in DOM
// LSR-03: No featureModal in DOM
// LSR-04: No hidden feature trigger in footer
// LSR-05: Auth/sign-in controls still present (direct signedin check)

const { test, expect } = require('../fixtures/cdn');

test('share button is absent from rail (LSR-01)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    // The share network icon button should not exist in the rail
    const shareBtn = page.locator('.yp-rail button[title="Share"]');
    await expect(shareBtn).toHaveCount(0);
});

test('shareModal is absent from DOM (LSR-02)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    const shareModal = page.locator('#shareModal');
    await expect(shareModal).toHaveCount(0);
});

test('featureModal is absent from DOM (LSR-03)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    const featureModal = page.locator('#featureModal');
    await expect(featureModal).toHaveCount(0);
});

test('footer contains no hidden feature trigger (LSR-04)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    // The hidden span with v-on:click="showFeatureModal = true" should not exist.
    // After removal, the footer should contain no Vue click binding for featureModal.
    const footerText = await page.locator('#footer-text-right').innerHTML();
    expect(footerText).not.toContain('showFeatureModal');
});

test('sign-in button is present in rail when not signed in (LSR-05)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    // Auth controls are now rendered by direct signedin checks (feature.signin removed).
    // A signed-out user should see a sign-in button.
    const signinBtn = page.locator('.yp-rail button[title="Sign in"]');
    await expect(signinBtn).toBeVisible();
});
