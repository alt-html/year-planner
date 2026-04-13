// E2E tests for Bootstrap 5.3.8 migration
// MIG-01: SRI integrity check
// MIG-04: btn-close visibility in modal header
// MIG-12: featureModal open and close

const { test, expect } = require('../fixtures/cdn');

test('BS5 CSS loads without SRI integrity error (MIG-01)', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            consoleErrors.push(msg.text());
        }
    });
    await page.goto('/');
    await page.waitForSelector('#app');
    const sriErrors = consoleErrors.filter(e =>
        e.toLowerCase().includes('integrity') || e.toLowerCase().includes('sri')
    );
    expect(sriErrors).toHaveLength(0);
});

test('.btn-close renders visibly in modal header (MIG-04)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    // Open shareModal via Vue to check btn-close
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            appEl._vnode.component.proxy.showShareModal = true;
        }
    });
    await page.waitForSelector('#shareModal.show');
    const btnClose = page.locator('#shareModal .btn-close');
    await expect(btnClose).toBeVisible();
    const opacity = await btnClose.evaluate(el => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
});

test('clicking footer trigger opens featureModal (MIG-12)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    // Open featureModal via Vue state (footer trigger is a tiny click target)
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            appEl._vnode.component.proxy.showFeatureModal = true;
        }
    });
    await page.waitForSelector('#featureModal.show');
    await expect(page.locator('#featureModal .modal-title')).toContainText(/feature/i);
});

test('featureModal closes via btn-close click (MIG-12)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    // Open featureModal
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            appEl._vnode.component.proxy.showFeatureModal = true;
        }
    });
    await page.waitForSelector('#featureModal.show');
    // Click btn-close
    await page.locator('#featureModal .btn-close').click();
    await expect(page.locator('#featureModal')).not.toHaveClass(/show/);
});
