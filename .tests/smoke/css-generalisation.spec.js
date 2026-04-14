// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CSS_DIR = path.resolve(__dirname, '..', '..', 'site', 'css');

test('design-tokens.css exists (CSS-01)', () => {
  expect(fs.existsSync(path.join(CSS_DIR, 'design-tokens.css'))).toBe(true);
});

test('rail.css exists (CSS-02)', () => {
  expect(fs.existsSync(path.join(CSS_DIR, 'rail.css'))).toBe(true);
});

test('dots.css exists (CSS-03)', () => {
  expect(fs.existsSync(path.join(CSS_DIR, 'dots.css'))).toBe(true);
});

test('design-tokens.css content is correct (CSS-01)', () => {
  const content = fs.readFileSync(path.join(CSS_DIR, 'design-tokens.css'), 'utf8');
  expect(content).toContain(':root,');
  expect(content).toContain('[data-theme="ink"]');
  expect(content).toContain('[data-theme="crisp"]');
  expect(content).not.toContain('.yp-rail');
  expect(content).not.toContain('.yp-dot');
});

test('rail.css content is correct (CSS-02)', () => {
  const content = fs.readFileSync(path.join(CSS_DIR, 'rail.css'), 'utf8');
  expect(content).toContain('.yp-rail {');
  expect(content).toContain('.rail-flyout {');
  expect(content).toContain('.rail-toggle {');
  expect(content).not.toContain(':root');
});

test('dots.css content is correct (CSS-03)', () => {
  const content = fs.readFileSync(path.join(CSS_DIR, 'dots.css'), 'utf8');
  expect(content).toContain('.yp-dot {');
  expect(content).toContain('.yp-dot-clear');
  expect(content).toContain('.yp-dot-c8');
  expect(content).toContain('.marker-flyout button.yp-dot-c1');
});

test('main.css no longer contains extracted blocks (CSS-01/02/03)', () => {
  const content = fs.readFileSync(path.join(CSS_DIR, 'main.css'), 'utf8');
  expect(content).not.toContain(':root,');
  expect(content).not.toContain('.yp-rail {');
  expect(content).not.toContain('.yp-dot {');
  // Non-extracted content still present
  expect(content).toContain('@media print');
  expect(content).toContain('.yp-jumbotron');
});

// Enable after CSS-04 rename in Plan 02
test.skip('no bare custom property references remain in CSS files (CSS-04)', () => {
  const files = ['design-tokens.css', 'rail.css', 'dots.css', 'main.css'];
  const barePropertyRegex = /var\(--(?!yp-|bs-)[a-z]/;
  for (const file of files) {
    const content = fs.readFileSync(path.join(CSS_DIR, file), 'utf8');
    expect(content).not.toMatch(barePropertyRegex);
  }
});

// Enable after CSS-05 in Plan 02
test.skip('site/index.html contains link tags for extracted CSS files (CSS-05)', () => {
  const indexPath = path.resolve(__dirname, '..', '..', 'site', 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');
  expect(content).toContain('design-tokens.css');
  expect(content).toContain('rail.css');
  expect(content).toContain('dots.css');
});
