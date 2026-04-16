// .tests/e2e/plannerstore-import-modern.spec.js
// Verifies PlannerStore.importDays accepts modern day shape only.
const { test, expect } = require('../fixtures/cdn');

test('PlannerStore.importDays imports modern shape and ignores legacy numeric aliases', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_plannerstore_import_seeded')) return;
    sessionStorage.setItem('_plannerstore_import_seeded', '1');
    localStorage.clear();
  });

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  const result = await page.evaluate(() => {
    const vm = document.getElementById('app')?._vnode?.component?.proxy;
    if (!vm?.plannerStore) return null;

    const year = vm.year || new Date().getFullYear();
    const months = Array.from({ length: 12 }, () => null);
    months[0] = {
      '2': { tp: 1, tl: 'modern import', col: 2, notes: 'modern notes', emoji: '🎯' },
      // Legacy numeric contract intentionally no longer supported in PlannerStore.importDays
      '3': { '0': 1, '1': 'legacy import', '2': 4, '3': 'legacy notes', '4': '🎉' },
    };

    vm.plannerStore.importDays(year, months);

    const active = localStorage.getItem('active-planner');
    const doc = active ? JSON.parse(localStorage.getItem(`plnr:${active}`) || '{}') : {};
    const modern = doc?.days?.[`${year}-01-02`];
    const legacy = doc?.days?.[`${year}-01-03`];

    return { modern, legacy };
  });

  expect(result).not.toBeNull();
  expect(result.modern).toBeTruthy();
  expect(result.modern.tp).toBe(1);
  expect(result.modern.tl).toBe('modern import');
  expect(result.modern.col).toBe(2);
  expect(result.modern.notes).toBe('modern notes');
  expect(result.modern.emoji).toBe('🎯');

  expect(result.legacy).toBeUndefined();
});
