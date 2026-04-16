# Codebase Map

Generated: 2026-04-16T00:34:15Z | Files: 174 | Described: 0/174
<!-- gsd:codebase-meta {"generatedAt":"2026-04-16T00:34:15Z","fingerprint":"e4413452a9460b0a9c03013742c7c07b67a18644","fileCount":174,"truncated":false} -->

### (root)/
- `.gitignore`
- `.mcp.json`
- `AGENTS.md`
- `CLAUDE.md`
- `LICENCE.txt`
- `README.md`

### .compose/
- `.compose/build.sh`
- `.compose/index.html.m4`
- `.compose/RESEARCH.md`

### .compose/fragments/
- `.compose/fragments/footer.html`
- `.compose/fragments/grid.html`
- `.compose/fragments/head.html`
- `.compose/fragments/modals.html`
- `.compose/fragments/nav.html`
- `.compose/fragments/rail.html`
- `.compose/fragments/scripts.html`
- `.compose/fragments/spinner.html`

### .compose/fragments/modals/
- `.compose/fragments/modals/auth.html`
- `.compose/fragments/modals/delete.html`
- `.compose/fragments/modals/entry.html`
- `.compose/fragments/modals/feature.html`
- `.compose/fragments/modals/share.html`

### .docker/
- `.docker/.dockerignore`
- `.docker/Dockerfile-nginx-16-alpine`
- `.docker/Dockerfile-node-16-alpine`
- `.docker/nginx.conf`

### .docker/bin/
- `.docker/bin/build`
- `.docker/bin/delete`
- `.docker/bin/images`
- `.docker/bin/prune`
- `.docker/bin/ps`
- `.docker/bin/run`
- `.docker/bin/unset-env`

### .github/workflows/
- `.github/workflows/e2e.yml`

### .minikube/bin/
- `.minikube/bin/start`

### .scripts/
- `.scripts/generate-sri.mjs`

### .skaffold/
- `.skaffold/skaffold.yaml`

### .skaffold/bin/
- `.skaffold/bin/delete`
- `.skaffold/bin/dev`
- `.skaffold/bin/env`
- `.skaffold/bin/init`
- `.skaffold/bin/run`

### .skaffold/manifests/
- `.skaffold/manifests/k8s-local-dev.yaml`

### .tests/
- `.tests/globalSetup.js`
- `.tests/globalTeardown.js`
- `.tests/package-lock.json`
- `.tests/package.json`
- `.tests/playwright.config.js`

### .tests/e2e/
- `.tests/e2e/account-linking.spec.js`
- `.tests/e2e/auth-modal.spec.js`
- `.tests/e2e/boot.spec.js`
- `.tests/e2e/bs5-migration.spec.js`
- `.tests/e2e/contract-sync.spec.js`
- `.tests/e2e/cross-profile-sync.spec.js`
- `.tests/e2e/entry-crud.spec.js`
- `.tests/e2e/hlc-write.spec.js`
- `.tests/e2e/migration.spec.js`
- `.tests/e2e/planner-management.spec.js`
- `.tests/e2e/rail-toggle.spec.js`
- `.tests/e2e/signin-pester.spec.js`
- `.tests/e2e/signout-wipe.spec.js`
- `.tests/e2e/sync-error.spec.js`
- `.tests/e2e/sync-payload.spec.js`
- `.tests/e2e/tooltip-xss.spec.js`
- `.tests/e2e/tp-col-coercion.spec.js`

### .tests/fixtures/
- `.tests/fixtures/alt-javascript-boot-esm.js`
- `.tests/fixtures/alt-javascript-boot-vue-esm.js`
- `.tests/fixtures/alt-javascript-cdi-esm.js`
- `.tests/fixtures/alt-javascript-common-esm.js`
- `.tests/fixtures/alt-javascript-config-esm.js`
- `.tests/fixtures/alt-javascript-logger-esm.js`
- `.tests/fixtures/bootstrap.min.css`
- `.tests/fixtures/bootstrap.min.js`
- `.tests/fixtures/cdn-routes.js`
- `.tests/fixtures/cdn.js`
- `.tests/fixtures/fontawesome.min.css`
- `.tests/fixtures/jquery.slim.min.js`
- `.tests/fixtures/lodash-es.min.js`
- `.tests/fixtures/lodash.min.js`
- `.tests/fixtures/luxon.min.js`
- `.tests/fixtures/lz-string.esm.js`
- `.tests/fixtures/popper.min.js`
- `.tests/fixtures/superagent.min.js`
- `.tests/fixtures/vue-i18n.global.prod.js`
- `.tests/fixtures/vue.global.prod.js`

### .tests/smoke/
- `.tests/smoke/compose.spec.js`
- `.tests/smoke/css-generalisation.spec.js`
- `.tests/smoke/dark-mode.spec.js`
- `.tests/smoke/harness.spec.js`
- `.tests/smoke/icon-candidates-assets.spec.js`
- `.tests/smoke/icon-candidates-gallery.spec.js`
- `.tests/smoke/icon-candidates-selection.spec.js`
- `.tests/smoke/icon-desktop-packaging.spec.js`
- `.tests/smoke/icon-export-matrix.spec.js`
- `.tests/smoke/icon-live-wiring.spec.js`

### .tests/verification/
- `.tests/verification/S06-visual-sign-off.spec.js`

### api/
- `api/openapi.yaml`

### docs/superpowers/plans/
- `docs/superpowers/plans/2026-04-10-phase-12-local-poc.md`
- `docs/superpowers/plans/2026-04-10-year-planner-auth-lifecycle-plan.md`
- `docs/superpowers/plans/2026-04-11-sync-validation-planner-alignment.md`
- `docs/superpowers/plans/2026-04-12-multi-doc-sync-ownership-selector.md`

### docs/superpowers/specs/
- `docs/superpowers/specs/2026-04-10-auth-identity-lifecycle-design.md`
- `docs/superpowers/specs/2026-04-10-deployment-design.md`
- `docs/superpowers/specs/2026-04-10-schema-contract-tests-design.md`
- `docs/superpowers/specs/2026-04-11-sync-validation-planner-alignment-design.md`
- `docs/superpowers/specs/2026-04-12-multi-doc-sync-ownership-selector-design.md`

### mockups/
- `mockups/A-ink-and-paper.html`
- `mockups/B-nordic-clarity.html`
- `mockups/C-verdant-studio.html`
- `mockups/combined-themes.html`
- `mockups/icon-comparison.html`

### mockups/icon-candidates/
- `mockups/icon-candidates/alternatives.json`
- `mockups/icon-candidates/canonical.json`
- `mockups/icon-candidates/README.md`

### scripts/
- `scripts/export-canonical-icon-matrix.sh`
- `scripts/export-desktop-packaging-assets.sh`
- `scripts/export-icon-candidates.sh`

### scripts/lib/
- `scripts/lib/pack-ico.py`

### site/
- `site/index.html`
- `site/manifest.json`

### site/css/
- `site/css/design-tokens.css`
- `site/css/dots.css`
- `site/css/main.css`
- `site/css/rail.css`
- `site/css/sqpaymentform.css`
- `site/css/typeaheadjs.css`
- `site/css/yp-dark.css`

### site/icons/
- `site/icons/desktop-matrix.json`
- `site/icons/matrix.json`

### site/icons/desktop/
- `site/icons/desktop/year-planner.icns`

### site/js/
- `site/js/Application.js`
- `site/js/main.js`

### site/js/auth/
- `site/js/auth/auth-config.js`
- `site/js/auth/AuthService.js`
- `site/js/auth/OAuthClient.js`

### site/js/config/
- `site/js/config/config.js`
- `site/js/config/contexts.js`

### site/js/service/
- `site/js/service/Api.js`
- `site/js/service/PlannerStore.js`
- `site/js/service/storage-schema.js`
- `site/js/service/Storage.js`
- `site/js/service/StorageLocal.js`
- `site/js/service/SyncScheduler.js`

### site/js/util/
- `site/js/util/urlparam.js`

### site/js/vue/
- `site/js/vue/app.js`
- `site/js/vue/i18n.js`
- `site/js/vue/model-features.js`
- `site/js/vue/model.js`

### site/js/vue/i18n/
- `site/js/vue/i18n/ar.js`
- `site/js/vue/i18n/en.js`
- `site/js/vue/i18n/es.js`
- `site/js/vue/i18n/fr.js`
- `site/js/vue/i18n/hi.js`
- `site/js/vue/i18n/id.js`
- `site/js/vue/i18n/ja.js`
- `site/js/vue/i18n/lang.js`
- `site/js/vue/i18n/messages.js`
- `site/js/vue/i18n/pt.js`
- `site/js/vue/i18n/ru.js`
- `site/js/vue/i18n/tp.js`
- `site/js/vue/i18n/zh.js`

### site/js/vue/i18n/en/
- `site/js/vue/i18n/en/day.js`
- `site/js/vue/i18n/en/month.js`

### site/js/vue/methods/
- `site/js/vue/methods/auth.js`
- `site/js/vue/methods/calendar.js`
- `site/js/vue/methods/entries.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/rail.js`

### site/js/vue/model/
- `site/js/vue/model/auth.js`
- `site/js/vue/model/calendar.js`
- `site/js/vue/model/planner.js`
- `site/js/vue/model/ui.js`

### test-results/
- `test-results/.last-run.json`
