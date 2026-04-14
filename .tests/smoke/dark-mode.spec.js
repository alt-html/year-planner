const { test, expect } = require('@playwright/test');

test.describe('dark mode', () => {
    test('data-bs-theme attribute is set in dark mode', async ({ page }) => {
        await page.goto('/?theme=dark');
        await page.waitForSelector('[data-app-ready]');
        const app = page.locator('#app');
        await expect(app).toHaveAttribute('data-bs-theme', 'dark');
        await expect(page.locator('body')).toHaveClass(/yp-dark/);
    });

    test('data-bs-theme attribute is absent in light mode', async ({ page }) => {
        await page.goto('/?theme=light');
        await page.waitForSelector('[data-app-ready]');
        const app = page.locator('#app');
        await expect(app).not.toHaveAttribute('data-bs-theme');
        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
    });
});
