// E2E: Account Linking — Connected accounts, link, unlink, userKey migration
// Wave 0 stubs — implementation fills in assertions as features land.

const { test, expect } = require('../fixtures/cdn');

async function suppressPester(page) {
    await page.addInitScript(() => {
        localStorage.setItem('pester_signin', String(Date.now()));
    });
}

// Simulate a signed-in user by injecting a mock JWT into localStorage
async function simulateSignedIn(page, providers = ['github']) {
    await page.addInitScript((providerList) => {
        // Build a mock JWT payload: header.payload.signature
        // The payload contains sub, providers, email
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: 'test-uuid-001',
            providers: providerList,
            email: 'test@example.com',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        }));
        const signature = 'test-signature';
        const mockToken = `${header}.${payload}.${signature}`;
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('auth_provider', providerList[0] || 'github');
    }, providers);
}

test.describe('Account Linking', () => {

    test('connected accounts section shows linked providers in settings flyout (LNK-03)', async ({ page }) => {
        test.fixme(); // Wave 0 stub — Plan 01 implements
        await suppressPester(page);
        await simulateSignedIn(page, ['github']);
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        // TODO: Open settings flyout, verify "Connected Accounts" header visible
        // TODO: Verify "github" provider listed with icon
    });

    test('unlink button hidden when only one provider linked — last-provider guard (LNK-02)', async ({ page }) => {
        test.fixme(); // Wave 0 stub — Plan 01 implements
        await suppressPester(page);
        await simulateSignedIn(page, ['github']);
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        // TODO: Open settings flyout, verify no Unlink button when 1 provider
    });

    test('unlink button visible and calls DELETE when multiple providers linked (LNK-02)', async ({ page }) => {
        test.fixme(); // Wave 0 stub — Plan 01 implements
        await suppressPester(page);
        await simulateSignedIn(page, ['github', 'google']);
        await page.route('**/auth/providers/google', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ providers: [{ provider: 'github', providerUserId: 'gh-123' }] }),
            })
        );
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        // TODO: Open settings, click Unlink on google, verify DELETE request, verify google removed
    });

    test('link another account initiates OAuth redirect with link intent flag (LNK-01)', async ({ page }) => {
        test.fixme(); // Wave 0 stub — Plan 02 implements
        await suppressPester(page);
        await simulateSignedIn(page, ['github']);
        await page.route('**/auth/google', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ authorizationURL: 'https://oauth.test.invalid/authorize', state: 'test-state' }),
            })
        );
        await page.route('https://oauth.test.invalid/**', (route) => route.abort());
        await page.goto('/');
        await page.waitForSelector('[data-app-ready]');
        // TODO: Open settings, click "Link another account", verify oauth_link_intent in localStorage
    });

    test('after link callback, local planner userKeys migrate to primary UUID (LNK-04)', async ({ page }) => {
        test.fixme(); // Wave 0 stub — Plan 02 implements
        await suppressPester(page);
        // TODO: Set up localStorage with plnr:* entries having old userKey
        // TODO: Simulate link callback with ?code= and ?state= and oauth_link_intent
        // TODO: Verify plnr:* meta.userKey updated to primary UUID
    });

});
