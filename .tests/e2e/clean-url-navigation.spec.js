// E2E: Clean-URL navigation contract (T02)
// Asserts that year/theme/lang interactions are in-app state transitions
// with no hard navigation or ?uid=/?id= query params added to the URL.

'use strict';

const { test, expect } = require('../fixtures/cdn');

test.describe('clean-url navigation', () => {

    test('initial load has no uid or id query params in URL', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        const url = new URL(page.url());
        expect(url.searchParams.has('uid')).toBe(false);
        expect(url.searchParams.has('id')).toBe(false);
    });

    test('dark theme URL param sets dark mode without adding uid', async ({ page }) => {
        await page.goto('/?theme=dark');
        await page.waitForSelector('[data-app-ready]');
        const url = new URL(page.url());
        expect(url.searchParams.has('uid')).toBe(false);
        expect(url.searchParams.has('id')).toBe(false);
        await expect(page.locator('#app')).toHaveAttribute('data-bs-theme', 'dark');
    });

    test('doDarkToggle keeps URL clean and toggles theme in-app', async ({ page }) => {
        await page.goto('/?theme=light');
        await page.waitForSelector('[data-app-ready]');
        const urlBefore = page.url();

        // Click the floating dark mode toggle
        await page.click('.float-btn[title="Toggle dark mode"]');
        await page.waitForTimeout(300);

        // URL must not have changed (no reload)
        expect(page.url()).toBe(urlBefore);
        // dark class applied in-app
        await expect(page.locator('body')).toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).toHaveAttribute('data-bs-theme', 'dark');
        // data-app-ready must still be present (no hard navigation)
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('toggling theme back to light removes dark styles without URL change', async ({ page }) => {
        await page.goto('/?theme=dark');
        await page.waitForSelector('[data-app-ready]');
        const urlBefore = page.url();

        await page.click('.float-btn[title="Toggle dark mode"]');
        await page.waitForTimeout(300);

        expect(page.url()).toBe(urlBefore);
        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('year chevron navigation keeps URL clean and updates year display', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Read the current year from the nav display
        const currentYearText = await page.locator('.yp-nav-year-btn.current').textContent();
        const currentYear = parseInt(currentYearText.trim());
        const urlBefore = page.url();

        // Click next year button
        await page.click('.yp-nav-year-btn[title="Next year"]');
        await page.waitForTimeout(300);

        // URL must not have changed
        expect(page.url()).toBe(urlBefore);
        // Year display must show next year
        const newYearText = await page.locator('.yp-nav-year-btn.current').textContent();
        expect(parseInt(newYearText.trim())).toBe(currentYear + 1);
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('previous year button decrements year without URL change', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        const currentYearText = await page.locator('.yp-nav-year-btn.current').textContent();
        const currentYear = parseInt(currentYearText.trim());
        const urlBefore = page.url();

        await page.click('.yp-nav-year-btn[title="Previous year"]');
        await page.waitForTimeout(300);

        expect(page.url()).toBe(urlBefore);
        const newYearText = await page.locator('.yp-nav-year-btn.current').textContent();
        expect(parseInt(newYearText.trim())).toBe(currentYear - 1);
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('language switch keeps URL clean and updates locale', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        const urlBefore = page.url();

        // Open the language dropdown
        await page.click('button.dropdown-toggle');
        await page.waitForSelector('.dropdown-menu', { state: 'visible' });

        // Click Spanish
        await page.click('.dropdown-item[href="#"]:has-text("español")');
        await page.waitForTimeout(300);

        // URL unchanged, no reload
        expect(page.url()).toBe(urlBefore);
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
        // dropdown button now shows the new language label
        await expect(page.locator('button.dropdown-toggle')).toContainText('es');
    });

    test('malformed year input is ignored without crash', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) {
                vm.jumpToYear('notanumber');
                vm.jumpToYear(-5);
                vm.jumpToYear(99999);
            }
        });
        // App must still be ready
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('invalid theme value is ignored', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setTheme('invalid-theme');
        });
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('invalid language code is ignored', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setLang('xx');
        });
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

});
