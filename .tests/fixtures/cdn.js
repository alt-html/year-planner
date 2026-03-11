// Custom Playwright fixture that intercepts CDN requests and serves local files.
// All E2E specs should require this instead of '@playwright/test':
//   const { test, expect } = require('../fixtures/cdn');
//
// Routes are registered in order — first match wins. Critical JS first, stubs last.

const { test: base, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const fixturesDir = path.join(__dirname); // .tests/fixtures/

function localFile(filename, contentType) {
  return (route) => {
    const filePath = path.join(fixturesDir, filename);
    if (fs.existsSync(filePath)) {
      route.fulfill({ path: filePath, contentType });
    } else {
      route.fulfill({ status: 200, body: '' });
    }
  };
}

const test = base.extend({
  page: async ({ page }, use) => {
    // 1. Vue 3 UMD global build
    await page.route('**/vue@3/dist/vue.global.prod.js', localFile('vue.global.prod.js', 'application/javascript'));
    // 2. Vue-i18n UMD global build
    await page.route('**/vue-i18n@9/dist/vue-i18n.global.prod.js', localFile('vue-i18n.global.prod.js', 'application/javascript'));
    // 3. Luxon ES6 module build (exports DateTime)
    await page.route('**/luxon@2/build/es6/luxon.min.js', localFile('luxon.min.js', 'application/javascript'));
    // 4. LZ-String ESM build (export default LZString) — /+esm suffix in glob
    await page.route('**/lz-string/libs/lz-string.min.js/+esm', localFile('lz-string.esm.js', 'application/javascript'));
    // 5. Lodash-ES module build
    await page.route('**/lodash-es/lodash.min.js', localFile('lodash.min.js', 'application/javascript'));
    // 6. Superagent
    await page.route('**/superagent**', localFile('superagent.min.js', 'application/javascript'));
    // 7. Bootstrap JS
    await page.route('**/bootstrap/4.3.1/js/bootstrap.min.js', localFile('bootstrap.min.js', 'application/javascript'));
    // 8. jQuery slim
    await page.route('**/jquery-3.3.1.slim.min.js', localFile('jquery.slim.min.js', 'application/javascript'));
    // 9. Popper.js
    await page.route('**/popper.js/1.14.7/**', localFile('popper.min.js', 'application/javascript'));
    // 10. Bootstrap CSS
    await page.route('**/bootstrap/4.3.1/css/bootstrap.min.css', localFile('bootstrap.min.css', 'text/css'));
    // 11. Google Fonts — empty stub
    await page.route('**/fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, body: '', contentType: 'text/css' }));
    // 12. Polyfill.io — empty stub
    await page.route('**/polyfill.io/**', (route) => route.fulfill({ status: 200, body: '' }));
    // 13. FontAwesome — empty stub
    await page.route('**/fontawesome**', (route) => route.fulfill({ status: 200, body: '' }));
    // 14. FontAwesome Kit — empty stub
    await page.route('**/kit.fontawesome.com/**', (route) => route.fulfill({ status: 200, body: '' }));
    // 15. Square payments — empty stub
    await page.route('**/squareup.com/**', (route) => route.fulfill({ status: 200, body: '' }));

    await use(page);
  },
});

module.exports = { test, expect };
