// E2E-AUTH: Auth modal sign-in button tests
// Verifies the Google sign-in button is present and initiates the PKCE redirect flow,
// GitHub button visibility and redirect initiation,
// and that Apple/Microsoft buttons are hidden when clientId is not configured.

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

test('Apple button is hidden when clientId is not configured (GHO-04, replaces E2E-AUTH-02)', async ({ page }) => {
    await suppressPester(page);
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    const appleBtn = page.locator('#authModal button:has-text("Sign in with Apple")');
    await expect(appleBtn).toHaveCount(0, { timeout: 3000 });
});

test('Microsoft button is hidden when clientId is not configured (GHO-04, replaces E2E-AUTH-03)', async ({ page }) => {
    await suppressPester(page);
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    const msBtn = page.locator('#authModal button:has-text("Sign in with Microsoft")');
    await expect(msBtn).toHaveCount(0, { timeout: 3000 });
});

test('auth modal has GitHub sign-in button that initiates OAuth redirect (E2E-AUTH-04)', async ({ page }) => {
    await suppressPester(page);

    await page.route('**/auth/github', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                authorizationURL: 'https://github.test.invalid/authorize',
                state: 'test-state',
                codeVerifier: 'test-verifier',
            }),
        })
    );
    await page.route('https://github.test.invalid/**', (route) => route.abort());

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    const githubBtn = page.locator('#authModal button:has-text("Sign in with GitHub")');
    await expect(githubBtn).toBeVisible({ timeout: 3000 });
    await expect(githubBtn).toBeEnabled();

    const authRequest = page.waitForRequest('**/auth/github');
    githubBtn.click().catch(() => {});
    await authRequest;
});

test('GitHub sign-in writes oauth_intended_provider to localStorage before redirect (GHO-02)', async ({ page }) => {
    await suppressPester(page);

    // Intercept localStorage.setItem to capture the oauth_intended_provider write.
    // This fires synchronously before window.location.href is set, so it survives
    // even if the navigation aborts the page context immediately after.
    let capturedProvider = null;
    await page.exposeFunction('__captureLocalStorageSet', (key, value) => {
        if (key === 'oauth_intended_provider') capturedProvider = value;
    });
    await page.addInitScript(() => {
        const originalSet = localStorage.setItem.bind(localStorage);
        localStorage.setItem = (key, value) => {
            originalSet(key, value);
            if (typeof window.__captureLocalStorageSet === 'function') {
                window.__captureLocalStorageSet(key, value);
            }
        };
    });

    await page.route('**/auth/github', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                authorizationURL: 'https://github.test.invalid/authorize',
                state: 'test-state',
                codeVerifier: 'test-verifier',
            }),
        })
    );
    await page.route('https://github.test.invalid/**', (route) => route.abort());

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    await openAuthModal(page);

    const githubBtn = page.locator('#authModal button:has-text("Sign in with GitHub")');
    githubBtn.click().catch(() => {});
    await page.waitForRequest('**/auth/github');

    // Give the synchronous localStorage.setItem call time to propagate
    await page.waitForTimeout(500);

    expect(capturedProvider).toBe('github');
});

test('OAuth keys cleaned up from localStorage after token exchange (GHO-03)', async ({ page }) => {
    await suppressPester(page);

    // Pre-seed OAuth flow state as if a redirect just happened
    await page.addInitScript(() => {
        localStorage.setItem('oauth_intended_provider', 'github');
        localStorage.setItem('oauth_state', 'test-state');
        localStorage.setItem('oauth_code_verifier', 'test-verifier');
    });

    // Navigate with ?token= to trigger the callback handler
    await page.goto('/?token=fake-jwt-token');
    await page.waitForSelector('[data-app-ready]');

    // Verify all OAuth keys were cleaned up
    const keys = await page.evaluate(() => ({
        intended: localStorage.getItem('oauth_intended_provider'),
        state: localStorage.getItem('oauth_state'),
        verifier: localStorage.getItem('oauth_code_verifier'),
        provider: localStorage.getItem('auth_provider'),
    }));

    expect(keys.intended).toBeNull();
    expect(keys.state).toBeNull();
    expect(keys.verifier).toBeNull();
    expect(keys.provider).toBe('github');
});
