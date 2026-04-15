// .tests/smoke/icon-candidates-assets.spec.js
// Filesystem assertions for the icon-candidate asset contract.
// Enforces: 3 candidate folders present, each with icon.svg + logo.svg, correct viewBox values,
// and a full preview-{16,32,180,192,512}.png matrix per candidate.
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

// ── Suite: preview matrix ────────────────────────────────────────────────────

const PREVIEW_SIZES = [16, 32, 180, 192, 512];

test.describe('preview matrix', () => {

  test('all 15 preview PNGs exist (3 candidates × 5 sizes)', () => {
    const missing = [];
    for (const { id, folder } of CANDIDATES) {
      for (const size of PREVIEW_SIZES) {
        const filePath = path.join(MOCKUPS_ROOT, folder, `preview-${size}.png`);
        if (!fs.existsSync(filePath)) {
          missing.push(`${id}/${folder}/preview-${size}.png`);
        }
      }
    }
    expect(
      missing,
      `Missing preview PNGs:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });

  for (const { id, folder } of CANDIDATES) {
    for (const size of PREVIEW_SIZES) {
      test(`${id} preview-${size}.png is non-empty`, () => {
        const filePath = path.join(MOCKUPS_ROOT, folder, `preview-${size}.png`);
        expect(
          fs.existsSync(filePath),
          `Missing: mockups/icon-candidates/${folder}/preview-${size}.png — run bash scripts/export-icon-candidates.sh`
        ).toBe(true);
        const stats = fs.statSync(filePath);
        expect(
          stats.size,
          `preview-${size}.png for ${id} is zero bytes — re-export with bash scripts/export-icon-candidates.sh`
        ).toBeGreaterThan(0);
      });
    }
  }

  test('preview PNGs start with PNG magic bytes', () => {
    const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const bad = [];
    for (const { id, folder } of CANDIDATES) {
      for (const size of PREVIEW_SIZES) {
        const filePath = path.join(MOCKUPS_ROOT, folder, `preview-${size}.png`);
        if (!fs.existsSync(filePath)) {
          bad.push(`${id}/preview-${size}.png (missing)`);
          continue;
        }
        const header = Buffer.alloc(4);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, header, 0, 4, 0);
        fs.closeSync(fd);
        if (!header.equals(PNG_MAGIC)) {
          bad.push(`${id}/preview-${size}.png (bad magic bytes: ${header.toString('hex')})`);
        }
      }
    }
    expect(
      bad,
      `Files with invalid PNG headers:\n  ${bad.join('\n  ')}`
    ).toHaveLength(0);
  });
});
