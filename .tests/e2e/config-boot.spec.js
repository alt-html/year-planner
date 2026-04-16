// E2E: Boot config object import via vueStarter
// Verifies the imported config object is accepted by vueStarter/Boot,
// exposed as a config bean, and profile-derived values are applied.

const { test, expect } = require('../fixtures/cdn');

test('vueStarter exposes processed config bean from imported config object', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  const runtime = await page.evaluate(() => {
    const appCtx = window.applicationContext;
    if (!appCtx) return { hasContext: false };

    const cfg = typeof appCtx.get === 'function' ? appCtx.get('config') : null;
    if (!cfg) return { hasContext: true, hasConfig: false };

    return {
      hasContext: true,
      hasConfig: true,
      hasHas: typeof cfg.has === 'function',
      hasGet: typeof cfg.get === 'function',
    };
  });

  expect(runtime.hasContext).toBe(true);
  expect(runtime.hasConfig).toBe(true);
  expect(runtime.hasHas).toBe(true);
  expect(runtime.hasGet).toBe(true);
});

test('vueStarter boot config resolves expected runtime values on localhost profile', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  const runtime = await page.evaluate(() => {
    const cfg = window.applicationContext.get('config');

    return {
      apiUrl: cfg.get('api.url'),
      rootLogLevel: cfg.get('logging.level./'),
      loggingFormat: cfg.get('logging.format'),
    };
  });

  expect(runtime.apiUrl).toBe('http://127.0.0.1:8081/');
  expect(runtime.rootLogLevel).toBe('debug');
  expect(runtime.loggingFormat).toBe('text');
});
