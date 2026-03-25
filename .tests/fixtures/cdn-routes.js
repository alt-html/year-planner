// Shared CDN route intercept helper.
// Used by both globalSetup and the per-test cdn fixture so all alt-javascript
// ESM bundles are served from local fixture files in both contexts.

const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..', '..');  // year-planner root
const fixturesDir = __dirname;

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

async function registerCdnRoutes(page) {
  // Strip integrity attributes from the HTML before the browser evaluates them.
  // Without this, route-intercepted fixtures fail SRI checks in raw browser contexts
  // (globalSetup). Playwright's built-in fixture mechanism handles this automatically
  // via its internal route interception layer; globalSetup needs it explicitly.
  await page.route('**/index.html', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(/ integrity="[^"]*"/g, '');
    route.fulfill({ response, body, contentType: 'text/html' });
  });

  // Vue 3 UMD global build
  await page.route('**/vue@3.5.30/dist/vue.global.prod.js', localFile('vue.global.prod.js', 'application/javascript'));
  // Vue-i18n UMD global build
  await page.route('**/vue-i18n@9.14.5/dist/vue-i18n.global.prod.js', localFile('vue-i18n.global.prod.js', 'application/javascript'));
  // Luxon ES6 module build
  await page.route('**/luxon@2/build/es6/luxon.min.js', localFile('luxon.min.js', 'application/javascript'));
  // LZ-String ESM build
  await page.route('**/lz-string/libs/lz-string.min.js/+esm', localFile('lz-string.esm.js', 'application/javascript'));
  // Bootstrap JS
  await page.route('**/bootstrap/4.3.1/js/bootstrap.min.js', localFile('bootstrap.min.js', 'application/javascript'));
  // jQuery slim
  await page.route('**/jquery-3.3.1.slim.min.js', localFile('jquery.slim.min.js', 'application/javascript'));
  // Popper.js
  await page.route('**/popper.js/1.14.7/**', localFile('popper.min.js', 'application/javascript'));
  // Bootstrap CSS
  await page.route('**/bootstrap/4.3.1/css/bootstrap.min.css', localFile('bootstrap.min.css', 'text/css'));
  // Google Fonts stub
  await page.route('**/fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, body: '', contentType: 'text/css' }));
  // FontAwesome CSS
  await page.route('**/font-awesome/6.7.2/css/all.min.css', localFile('fontawesome.min.css', 'text/css'));
  // FontAwesome webfonts stub
  await page.route('**/font-awesome/**', (route) => route.fulfill({ status: 200, body: '', contentType: 'text/css' }));
  // @alt-javascript v3 ESM bundles
  await page.route('**/@alt-javascript/common@3**/alt-javascript-common-esm.js', localFile('alt-javascript-common-esm.js', 'application/javascript'));
  await page.route('**/@alt-javascript/config@3**/alt-javascript-config-esm.js', localFile('alt-javascript-config-esm.js', 'application/javascript'));
  await page.route('**/@alt-javascript/logger@3**/alt-javascript-logger-esm.js', localFile('alt-javascript-logger-esm.js', 'application/javascript'));
  await page.route('**/@alt-javascript/cdi@3**/alt-javascript-cdi-esm.js', localFile('alt-javascript-cdi-esm.js', 'application/javascript'));
  await page.route('**/@alt-javascript/boot@3**/alt-javascript-boot-esm.js', localFile('alt-javascript-boot-esm.js', 'application/javascript'));
  await page.route('**/@alt-javascript/boot-vue@3**/alt-javascript-boot-vue-esm.js', localFile('alt-javascript-boot-vue-esm.js', 'application/javascript'));
  // lodash-es (transitive dep of cdi bundle)
  await page.route('**/lodash-es/lodash.min.js', localFile('lodash-es.min.js', 'application/javascript'));
}

module.exports = { registerCdnRoutes };
