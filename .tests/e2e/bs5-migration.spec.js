// E2E tests for Bootstrap 5.3.8 migration
// MIG-01: SRI integrity check
// MIG-04: btn-close visibility in modal header (entry modal — share/feature modals removed in M013/S03)

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

test('.btn-close renders visibly in delete modal header (MIG-04)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-app-ready]');
    // Open deleteModal via Vue to check btn-close (shareModal was removed in M013/S03)
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            appEl._vnode.component.proxy.showDeleteModal = true;
        }
    });
    await page.waitForSelector('#deleteModal.show');
    const btnClose = page.locator('#deleteModal .btn-close');
    await expect(btnClose).toBeVisible();
    const opacity = await btnClose.evaluate(el => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
});
