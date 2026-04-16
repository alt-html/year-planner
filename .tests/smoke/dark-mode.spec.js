const { test, expect } = require('@playwright/test');

// Helper: clear stored prefs so fresh install defaults apply (system-follow modes)
async function clearPrefs(page) {
    await page.addInitScript(() => {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
        }
    });
}

test.describe('dark mode', () => {
    test('data-bs-theme attribute is set in dark mode', async ({ page }) => {
        // Use OS dark preference → fresh install defaults to system-follow → dark
        await page.emulateMedia({ colorScheme: 'dark' });
        await clearPrefs(page);
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        const app = page.locator('#app');
        await expect(app).toHaveAttribute('data-bs-theme', 'dark');
        await expect(page.locator('body')).toHaveClass(/yp-dark/);
    });

    test('data-bs-theme attribute is absent in light mode', async ({ page }) => {
        // Use OS light preference → fresh install defaults to system-follow → light
        await page.emulateMedia({ colorScheme: 'light' });
        await clearPrefs(page);
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        const app = page.locator('#app');
        await expect(app).not.toHaveAttribute('data-bs-theme');
        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
    });

    test('dark toggle is in-app — URL does not change on click', async ({ page }) => {
        // Start in light mode, click toggle, URL must remain unchanged (no hard navigation)
        await page.emulateMedia({ colorScheme: 'light' });
        await clearPrefs(page);
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        const urlBefore = page.url();
        await page.click('.float-btn[title="Toggle dark mode"]');
        await page.waitForTimeout(300);
        expect(page.url()).toBe(urlBefore);
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });
});
