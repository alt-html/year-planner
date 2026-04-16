// @ts-check
const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

test('compose build produces identical index.html (COMP-02)', () => {
  const before = fs.readFileSync(path.join(ROOT, 'site', 'index.html'), 'utf8');
  // Run m4 to stdout to avoid writing to site/index.html during parallel test execution
  // (concurrent writes race with other workers reading the file, causing flaky failures)
  const after = execSync('m4 -P .compose/index.html.m4', { cwd: ROOT, encoding: 'utf8' });
  expect(after).toBe(before);
});

test('.compose/ fragment directory exists with nested structure (COMP-02)', () => {
  const fragmentsDir = path.join(ROOT, '.compose', 'fragments');
  expect(fs.existsSync(fragmentsDir)).toBe(true);

  // Top-level fragments
  const topFiles = ['head.html', 'spinner.html', 'rail.html', 'nav.html', 'grid.html', 'modals.html', 'footer.html', 'scripts.html'];
  for (const f of topFiles) {
    expect(fs.existsSync(path.join(fragmentsDir, f))).toBe(true);
  }

  // Nested modal fragments (demonstrates nesting — COMP-02)
  const modalDir = path.join(fragmentsDir, 'modals');
  expect(fs.existsSync(modalDir)).toBe(true);
  const modalFiles = ['entry.html', 'delete.html', 'auth.html'];
  for (const f of modalFiles) {
    expect(fs.existsSync(path.join(modalDir, f))).toBe(true);
  }
  // share.html and feature.html were removed in M013/S03
  const removedFiles = ['share.html', 'feature.html'];
  for (const f of removedFiles) {
    expect(fs.existsSync(path.join(modalDir, f))).toBe(false);
  }
});

test('build.sh is executable (COMP-02)', () => {
  const stat = fs.statSync(path.join(ROOT, '.compose', 'build.sh'));
  // Check owner-execute bit
  expect(stat.mode & 0o100).toBeTruthy();
});

test('m4 is available on the system (COMP-02)', () => {
  const result = execSync('which m4', { encoding: 'utf8' });
  expect(result.trim()).toBeTruthy();
});

test('modals.html demonstrates nesting — includes sub-fragments (COMP-02)', () => {
  const modalsContent = fs.readFileSync(path.join(ROOT, '.compose', 'fragments', 'modals.html'), 'utf8');
  // modals.html should contain m4_include directives for nested modal fragments
  expect(modalsContent).toContain('m4_include');
  expect(modalsContent).toContain('modals/entry.html');
  expect(modalsContent).toContain('modals/auth.html');
  // share.html and feature.html were removed in M013/S03
  expect(modalsContent).not.toContain('modals/feature.html');
  expect(modalsContent).not.toContain('modals/share.html');
});

test('rail no longer duplicates language button and includes System theme option', () => {
  const railContent = fs.readFileSync(path.join(ROOT, '.compose', 'fragments', 'rail.html'), 'utf8');
  expect(railContent).not.toContain('ph-globe-simple');
  expect(railContent).toContain("setTheme('system')");
  expect(railContent).toContain("$t('lang.system')");

  const indexContent = fs.readFileSync(path.join(ROOT, 'site', 'index.html'), 'utf8');
  expect(indexContent).not.toContain('ph-globe-simple');
  expect(indexContent).toContain("setTheme('system')");
});
