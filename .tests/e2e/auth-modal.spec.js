// E2E-AUTH: Auth modal sign-in button tests
// Verifies the Google rendered button appears in the modal and
// that Apple/Microsoft buttons dismiss the modal on click.

const { test, expect } = require('../fixtures/cdn');

// Inject a mock Google Sign-In SDK before each test.
// window.google is defined by addInitScript (runs before page scripts),
// and the SDK script URL is stubbed to fire onload with no real payload.
async function mockGoogleSdk(page) {
    await page.addInitScript(() => {
        window._googleRenderButtonCalled = false;
        window.google = {
            accounts: {
                id: {
                    initialize: () => {},
                    renderButton: (container) => {
                        window._googleRenderButtonCalled = true;
                        const btn = document.createElement('button');
                        btn.setAttribute('data-testid', 'google-signin-rendered');
                        btn.textContent = 'Sign in with Google';
                        btn.style.cssText = 'width:300px;height:40px;cursor:pointer;display:block;';
                        container.appendChild(btn);
                    },
                    prompt: () => {},
                },
            },
        };
    });
    // Stub the real SDK script URL so onload fires (AuthProvider._loadSDK resolves)
    await page.route('**/accounts.google.com/gsi/client', (route) =>
        route.fulfill({ status: 200, body: '', contentType: 'application/javascript' })
    );
}

// Open the auth modal directly via jQuery (railSigninBtn is off-screen in test viewport)
async function openAuthModal(page) {
    await page.evaluate(() => jQuery('#authModal').modal('show'));
    // shown.bs.modal fires after Bootstrap's 300ms fade animation completes
    await page.waitForSelector('#authModal.show');
}

test('auth modal renders Google sign-in button when opened (E2E-AUTH-01)', async ({ page }) => {
    await mockGoogleSdk(page);

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');

    await openAuthModal(page);

    // shown.bs.modal triggers signInWith('google') → _signInGoogle() → renderButton
    // Wait for renderButton to be called (async: SDK load + Vue proxy call)
    await page.waitForFunction(() => window._googleRenderButtonCalled === true, { timeout: 5000 });

    // The rendered button must be visible and interactable inside the modal
    const renderedBtn = page.locator('#authModal [data-testid="google-signin-rendered"]');
    await expect(renderedBtn).toBeVisible({ timeout: 3000 });
    await expect(renderedBtn).toBeEnabled();
});

test('Apple button closes modal immediately on click (E2E-AUTH-02)', async ({ page }) => {
    await mockGoogleSdk(page);

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');

    await openAuthModal(page);

    // Apple button has data-dismiss="modal" — Bootstrap closes it before auth resolves
    await page.locator('#authModal button:has-text("Sign in with Apple")').click();

    await expect(page.locator('#authModal')).not.toHaveClass(/\bshow\b/, { timeout: 2000 });
});

test('Microsoft button closes modal immediately on click (E2E-AUTH-03)', async ({ page }) => {
    await mockGoogleSdk(page);

    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');

    await openAuthModal(page);

    // Microsoft button has data-dismiss="modal" — Bootstrap closes it before auth resolves
    await page.locator('#authModal button:has-text("Sign in with Microsoft")').click();

    await expect(page.locator('#authModal')).not.toHaveClass(/\bshow\b/, { timeout: 2000 });
});
