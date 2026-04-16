// E2E: System-follow preference contract (T01)
// Asserts that year/lang/theme URL params are ignored at bootstrap (R103),
// that preferences persist langMode/themeMode fields (R107/R108),
// and that malformed inputs are handled gracefully.

'use strict';

const { test, expect } = require('../fixtures/cdn');

// ── URL param isolation ────────────────────────────────────────────────────────

test.describe('system-follow preferences — URL param isolation', () => {

    test('?year=2099 in URL is ignored — year comes from preferences not URL', async ({ page }) => {
        await page.addInitScript(() => {
            // Clear stored prefs so fallback is current year
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/?year=2099');
        await page.waitForSelector('[data-app-ready]');

        const yearText = await page.locator('.yp-nav-year-btn.current').textContent();
        const shownYear = parseInt(yearText.trim());
        const currentYear = new Date().getFullYear();

        expect(shownYear).not.toBe(2099);
        // Year must be within a plausible window, not the injected URL value
        expect(shownYear).toBeGreaterThanOrEqual(currentYear - 1);
        expect(shownYear).toBeLessThan(2099);
    });

    test('?lang=ar in URL is ignored — lang comes from preferences not URL', async ({ page }) => {
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/?lang=ar');
        await page.waitForSelector('[data-app-ready]');

        const docLang = await page.evaluate(() => document.documentElement.lang);
        expect(docLang).not.toBe('ar');
    });

    test('?theme=dark in URL is ignored — theme follows system when no prefs set', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/?theme=dark');
        await page.waitForSelector('[data-app-ready]');

        // System is light and no stored prefs — URL param must be ignored
        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).not.toHaveAttribute('data-bs-theme', 'dark');
    });

    test('?theme=light in URL is ignored — dark system preference wins', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/?theme=light');
        await page.waitForSelector('[data-app-ready]');

        // System is dark and no stored prefs — URL param must be ignored
        await expect(page.locator('body')).toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).toHaveAttribute('data-bs-theme', 'dark');
    });

    test('combined ?year=2099&lang=ar&theme=dark are all ignored', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/?year=2099&lang=ar&theme=dark');
        await page.waitForSelector('[data-app-ready]');

        const yearText = await page.locator('.yp-nav-year-btn.current').textContent();
        expect(parseInt(yearText.trim())).not.toBe(2099);

        const docLang = await page.evaluate(() => document.documentElement.lang);
        expect(docLang).not.toBe('ar');

        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
    });

    test('app still boots cleanly with no URL params', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });
});

// ── Mode contract persistence ──────────────────────────────────────────────────

test.describe('system-follow preferences — mode contract', () => {

    test('fresh install stores langMode and themeMode in preferences', async ({ page }) => {
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        const modes = await page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try {
                        const prefs = JSON.parse(localStorage.getItem(k));
                        return { langMode: prefs && prefs.langMode, themeMode: prefs && prefs.themeMode };
                    } catch (e) { return null; }
                }
            }
            return null;
        });

        expect(modes).not.toBeNull();
        expect(['system', 'explicit']).toContain(modes.langMode);
        expect(['system', 'explicit']).toContain(modes.themeMode);
    });

    test('fresh install with cleared prefs defaults to system follow modes', async ({ page }) => {
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        const modes = await page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try {
                        const prefs = JSON.parse(localStorage.getItem(k));
                        return { langMode: prefs && prefs.langMode, themeMode: prefs && prefs.themeMode };
                    } catch (e) { return null; }
                }
            }
            return null;
        });

        expect(modes).not.toBeNull();
        expect(modes.langMode).toBe('system');
        expect(modes.themeMode).toBe('system');
    });

    test('explicit lang preference persists and is restored on reload', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Set lang to 'fr' via in-app method
        await page.evaluate(() => {
            const vm = document.getElementById('app') &&
                document.getElementById('app')._vnode &&
                document.getElementById('app')._vnode.component &&
                document.getElementById('app')._vnode.component.proxy;
            if (vm) vm.setLang('fr');
        });
        await page.waitForTimeout(200);

        // Reload — 'fr' should come from stored prefs, not URL
        await page.reload();
        await page.waitForSelector('[data-app-ready]');

        const docLang = await page.evaluate(() => document.documentElement.lang);
        expect(docLang).toBe('fr');
    });

    test('explicit theme preference persists and is restored on reload', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Set theme to 'dark' via in-app method
        await page.evaluate(() => {
            const vm = document.getElementById('app') &&
                document.getElementById('app')._vnode &&
                document.getElementById('app')._vnode.component &&
                document.getElementById('app')._vnode.component.proxy;
            if (vm) vm.setTheme('dark');
        });
        await page.waitForTimeout(200);

        await page.reload();
        await page.waitForSelector('[data-app-ready]');

        await expect(page.locator('body')).toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).toHaveAttribute('data-bs-theme', 'dark');
    });

    test('preferences year survives reload without URL param', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Navigate to year 2025 in-app
        await page.evaluate(() => {
            const vm = document.getElementById('app') &&
                document.getElementById('app')._vnode &&
                document.getElementById('app')._vnode.component &&
                document.getElementById('app')._vnode.component.proxy;
            if (vm) vm.jumpToYear(2025);
        });
        await page.waitForTimeout(200);

        await page.reload();
        await page.waitForSelector('[data-app-ready]');

        const yearText = await page.locator('.yp-nav-year-btn.current').textContent();
        expect(parseInt(yearText.trim())).toBe(2025);
    });
});

// ── Live-follow and override (T02) ────────────────────────────────────────────

test.describe('system-follow preferences — live follow and override', () => {

    test('setTheme("dark") in system mode switches to explicit and applies dark', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Fresh install with light OS → system mode → light theme
        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);

        // Explicit override to dark
        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setTheme('dark');
        });
        await page.waitForTimeout(100);

        await expect(page.locator('body')).toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).toHaveAttribute('data-bs-theme', 'dark');

        // themeMode is now explicit
        const themeMode = await page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try { return JSON.parse(localStorage.getItem(k))?.themeMode; } catch (e) { return null; }
                }
            }
            return null;
        });
        expect(themeMode).toBe('explicit');
    });

    test('setTheme("system") returns to OS theme immediately without reload', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Go explicit dark
        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setTheme('dark');
        });
        await page.waitForTimeout(100);
        await expect(page.locator('body')).toHaveClass(/yp-dark/);

        // Return to system (OS is light)
        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setTheme('system');
        });
        await page.waitForTimeout(100);

        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).not.toHaveAttribute('data-bs-theme', 'dark');

        const themeMode = await page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try { return JSON.parse(localStorage.getItem(k))?.themeMode; } catch (e) { return null; }
                }
            }
            return null;
        });
        expect(themeMode).toBe('system');
    });

    test('OS color scheme change updates theme live when in system mode', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Fresh install → system mode → light
        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);

        // OS switches to dark — matchMedia change event fires
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.waitForTimeout(200);

        await expect(page.locator('body')).toHaveClass(/yp-dark/);
        await expect(page.locator('#app')).toHaveAttribute('data-bs-theme', 'dark');

        // OS switches back to light
        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForTimeout(200);

        await expect(page.locator('body')).not.toHaveClass(/yp-dark/);
    });

    test('OS color scheme change is ignored when themeMode is explicit', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Set explicit dark
        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setTheme('dark');
        });
        await page.waitForTimeout(100);
        await expect(page.locator('body')).toHaveClass(/yp-dark/);

        // OS switches to light — explicit mode should NOT follow
        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForTimeout(200);

        // Still dark because mode is explicit
        await expect(page.locator('body')).toHaveClass(/yp-dark/);
    });

    test('setLang("fr") sets langMode to explicit and persists', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setLang('fr');
        });
        await page.waitForTimeout(100);

        const docLang = await page.evaluate(() => document.documentElement.lang);
        expect(docLang).toBe('fr');

        const langMode = await page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try { return JSON.parse(localStorage.getItem(k))?.langMode; } catch (e) { return null; }
                }
            }
            return null;
        });
        expect(langMode).toBe('explicit');
    });

    test('setLang("system") returns to navigator language without reload', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        // Set explicit fr
        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setLang('fr');
        });
        await page.waitForTimeout(100);
        expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr');

        // Return to system — navigator.language in test env is 'en'
        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setLang('system');
        });
        await page.waitForTimeout(100);

        const docLang = await page.evaluate(() => document.documentElement.lang);
        // Should resolve to navigator language (typically 'en' in test env)
        expect(['en','zh','hi','ar','es','pt','fr','ru','id','ja']).toContain(docLang);

        const langMode = await page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try { return JSON.parse(localStorage.getItem(k))?.langMode; } catch (e) { return null; }
                }
            }
            return null;
        });
        expect(langMode).toBe('system');
    });

    test('setTheme with invalid value does not change state', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        const themeBefore = await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            return vm ? vm.theme : null;
        });

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setTheme('invalid-mode');
        });
        await page.waitForTimeout(50);

        const themeAfter = await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            return vm ? vm.theme : null;
        });
        expect(themeAfter).toBe(themeBefore);
    });

    test('setLang with unsupported code does not change state', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        const langBefore = await page.evaluate(() => document.documentElement.lang);

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) vm.setLang('xx');
        });
        await page.waitForTimeout(50);

        const langAfter = await page.evaluate(() => document.documentElement.lang);
        expect(langAfter).toBe(langBefore);
    });

    test('system mode → explicit → system round-trip keeps URL unchanged', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.addInitScript(() => {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) localStorage.removeItem(k);
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');

        const urlBefore = page.url();

        await page.evaluate(() => {
            const vm = document.getElementById('app')?._vnode?.component?.proxy;
            if (vm) { vm.setTheme('dark'); vm.setLang('fr'); vm.setTheme('system'); vm.setLang('system'); }
        });
        await page.waitForTimeout(200);

        expect(page.url()).toBe(urlBefore);
        const url = new URL(page.url());
        expect(url.searchParams.has('theme')).toBe(false);
        expect(url.searchParams.has('lang')).toBe(false);
    });
});

// ── Resilience / negative tests ────────────────────────────────────────────────

test.describe('system-follow preferences — resilience', () => {

    test('corrupted prefs JSON does not crash startup', async ({ page }) => {
        await page.addInitScript(() => {
            // Corrupt the prefs key for the current device
            const devKey = localStorage.getItem('dev');
            if (devKey) {
                localStorage.setItem('prefs:' + devKey, '{ invalid json !!');
            } else {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('prefs:')) {
                        localStorage.setItem(k, '{ invalid json !!');
                        break;
                    }
                }
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]', { timeout: 15000 });
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('unknown lang code in prefs falls back gracefully', async ({ page }) => {
        await page.addInitScript(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try {
                        const prefs = JSON.parse(localStorage.getItem(k));
                        if (prefs) { prefs.lang = 'xx'; localStorage.setItem(k, JSON.stringify(prefs)); }
                    } catch (e) { /* skip */ }
                    break;
                }
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('unknown mode values in prefs do not crash startup', async ({ page }) => {
        await page.addInitScript(() => {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('prefs:')) {
                    try {
                        const prefs = JSON.parse(localStorage.getItem(k));
                        if (prefs) {
                            prefs.langMode = 'bogus-mode';
                            prefs.themeMode = 'also-bogus';
                            localStorage.setItem(k, JSON.stringify(prefs));
                        }
                    } catch (e) { /* skip */ }
                    break;
                }
            }
        });
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('OAuth callback ?token param is still cleaned from URL after landing', async ({ page }) => {
        // A fake JWT — app will store it but it won't auth (test only checks URL cleanup)
        await page.goto('/?token=fake.jwt.token');
        await page.waitForSelector('[data-app-ready]', { timeout: 15000 });
        const url = new URL(page.url());
        expect(url.searchParams.has('token')).toBe(false);
        await expect(page.locator('[data-app-ready]')).toHaveCount(1);
    });

    test('app state params do not appear in URL after boot', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        const url = new URL(page.url());
        expect(url.searchParams.has('year')).toBe(false);
        expect(url.searchParams.has('lang')).toBe(false);
        expect(url.searchParams.has('theme')).toBe(false);
        expect(url.searchParams.has('uid')).toBe(false);
        expect(url.searchParams.has('id')).toBe(false);
    });
});
