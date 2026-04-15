// .tests/smoke/icon-candidates-assets.spec.js
// Filesystem assertions for the icon-candidate asset contract.
// Enforces: 3 candidate folders present, each with icon.svg + logo.svg, correct viewBox values.
// No browser required — all assertions are pure Node.js fs checks.

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const MOCKUPS_ROOT = path.join(__dirname, '..', '..', 'mockups', 'icon-candidates');

const CANDIDATES = [
  { id: 'C1', folder: 'C1-ink-paper' },
  { id: 'C2', folder: 'C2-nordic-clarity' },
  { id: 'C3', folder: 'C3-verdant-studio' },
];

// ── Helper: read SVG text from an expected path ──────────────────────────────

function readSVG(candidateFolder, filename) {
  const filePath = path.join(MOCKUPS_ROOT, candidateFolder, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

// ── Suite: candidate SVG masters ────────────────────────────────────────────

test.describe('candidate SVG masters', () => {

  test('exactly three candidate folders exist (C1, C2, C3)', () => {
    const entries = fs.readdirSync(MOCKUPS_ROOT).filter(
      (name) => fs.statSync(path.join(MOCKUPS_ROOT, name)).isDirectory()
    );
    const folderNames = entries.map((e) => e);
    const expectedFolders = CANDIDATES.map((c) => c.folder);

    for (const expected of expectedFolders) {
      expect(
        folderNames,
        `Expected folder "${expected}" to exist under mockups/icon-candidates/`
      ).toContain(expected);
    }

    // No unexpected extra candidate folders (folders starting with C)
    const candidateFolders = folderNames.filter((n) => /^C\d/.test(n));
    expect(
      candidateFolders.length,
      `Expected exactly 3 candidate folders (C1, C2, C3), found: ${candidateFolders.join(', ')}`
    ).toBe(3);
  });

  for (const { id, folder } of CANDIDATES) {
    test(`${id} (${folder}) has icon.svg`, () => {
      const filePath = path.join(MOCKUPS_ROOT, folder, 'icon.svg');
      expect(
        fs.existsSync(filePath),
        `Missing icon.svg for ${id}: expected at mockups/icon-candidates/${folder}/icon.svg`
      ).toBe(true);
    });

    test(`${id} (${folder}) has logo.svg`, () => {
      const filePath = path.join(MOCKUPS_ROOT, folder, 'logo.svg');
      expect(
        fs.existsSync(filePath),
        `Missing logo.svg for ${id}: expected at mockups/icon-candidates/${folder}/logo.svg`
      ).toBe(true);
    });

    test(`${id} icon.svg is non-empty and contains a viewBox`, () => {
      const content = readSVG(folder, 'icon.svg');
      expect(content, `icon.svg for ${id} is missing or empty`).not.toBeNull();
      expect(content.length, `icon.svg for ${id} is empty`).toBeGreaterThan(0);
      expect(
        content,
        `icon.svg for ${id} must contain viewBox attribute`
      ).toContain('viewBox');
    });

    test(`${id} logo.svg is non-empty and contains a viewBox`, () => {
      const content = readSVG(folder, 'logo.svg');
      expect(content, `logo.svg for ${id} is missing or empty`).not.toBeNull();
      expect(content.length, `logo.svg for ${id} is empty`).toBeGreaterThan(0);
      expect(
        content,
        `logo.svg for ${id} must contain viewBox attribute`
      ).toContain('viewBox');
    });

    test(`${id} icon.svg has canonical 512×512 viewBox`, () => {
      const content = readSVG(folder, 'icon.svg');
      expect(content, `icon.svg for ${id} is missing`).not.toBeNull();
      expect(
        content,
        `icon.svg for ${id} must have viewBox="0 0 512 512"`
      ).toContain('viewBox="0 0 512 512"');
    });

    test(`${id} logo.svg has canonical 480×120 viewBox`, () => {
      const content = readSVG(folder, 'logo.svg');
      expect(content, `logo.svg for ${id} is missing`).not.toBeNull();
      expect(
        content,
        `logo.svg for ${id} must have viewBox="0 0 480 120"`
      ).toContain('viewBox="0 0 480 120"');
    });

    test(`${id} icon.svg has a <title> element`, () => {
      const content = readSVG(folder, 'icon.svg');
      expect(content, `icon.svg for ${id} is missing`).not.toBeNull();
      expect(
        content,
        `icon.svg for ${id} must contain a <title> element for accessibility`
      ).toMatch(/<title>/);
    });
  }

  test('contract README exists', () => {
    const readmePath = path.join(MOCKUPS_ROOT, 'README.md');
    expect(
      fs.existsSync(readmePath),
      'mockups/icon-candidates/README.md must exist'
    ).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content.length, 'README.md is empty').toBeGreaterThan(100);
  });
});
