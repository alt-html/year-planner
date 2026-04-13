// E2E-AUTH: Auth modal sign-in button tests
// Verifies the Google sign-in button is present and initiates the PKCE redirect flow,
// and that Apple/Microsoft buttons dismiss the modal on click.

const { test, expect } = require('../fixtures/cdn');

async function suppressPester(page) {
    await page.addInitScript(() => {
        localStorage.setItem('pester_signin', String(Date.now()));
    });
}

// Open the auth modal via the Vue app instance (no jQuery)
async function openAuthModal(page) {
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            appEl._vnode.component.proxy.showSignin();
        }
    });
    await page.waitForSelector('#authModal.show');
}

test('auth modal has Google sign-in button that initiates OAuth redirect (E2E-AUTH-01)', async ({ page }) => {
    await suppressPester(page);

    // Stub auth/google so the PKCE flow doesn't hit a real server
    await page.route('**/auth/google', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                authorizationURL: 'https://oauth.test.invalid/authorize',
                state: 'test-state',
                codeVerifier: 'test-verifier',
            }),
        })
    );
    // Abort the Google redirect so the page doesn't navigate away
    await page.route('https://oauth.test.invalid/**', (route) => route.abort());

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    const googleBtn = page.locator('#authModal button:has-text("Sign in with Google")');
    await expect(googleBtn).toBeVisible({ timeout: 3000 });
    await expect(googleBtn).toBeEnabled();

    // Click and verify the PKCE initiation request was made
    const authRequest = page.waitForRequest('**/auth/google');
    googleBtn.click().catch(() => {}); // navigation abort may throw — suppress
    await authRequest;
});

test('Apple button closes modal immediately on click (E2E-AUTH-02)', async ({ page }) => {
    await suppressPester(page);

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    // Apple button calls signInWith('apple') which sets showAuthModal = false immediately
    await page.locator('#authModal button:has-text("Sign in with Apple")').click();

    await expect(page.locator('#authModal')).not.toHaveClass(/\bshow\b/, { timeout: 2000 });
});

test('Microsoft button closes modal immediately on click (E2E-AUTH-03)', async ({ page }) => {
    await suppressPester(page);

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    // Microsoft button calls signInWith('microsoft') which sets showAuthModal = false immediately
    await page.locator('#authModal button:has-text("Sign in with Microsoft")').click();

    await expect(page.locator('#authModal')).not.toHaveClass(/\bshow\b/, { timeout: 2000 });
});
