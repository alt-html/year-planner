// @ts-check
const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

test('compose build produces identical index.html (COMP-02)', () => {
  const before = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  execSync('bash .compose/build.sh', { cwd: ROOT });
  const after = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
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
  const modalFiles = ['entry.html', 'share.html', 'delete.html',
                       'auth.html', 'feature.html'];
  for (const f of modalFiles) {
    expect(fs.existsSync(path.join(modalDir, f))).toBe(true);
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
  expect(modalsContent).toContain('modals/feature.html');
});
