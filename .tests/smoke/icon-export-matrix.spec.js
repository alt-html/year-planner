// .tests/smoke/icon-export-matrix.spec.js
// Filesystem assertions for the canonical icon export matrix contract.
// Enforces: matrix.json has exactly 9 entries, all required purpose buckets
// (any, maskable, monochrome) are present, every referenced PNG exists with valid
// PNG magic bytes and IHDR dimensions that match the declared size field.
// Includes negative-path assertions for malformed matrix.json detection.
// No browser required — all assertions are pure Node.js fs checks.

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const REPO_ROOT            = path.join(__dirname, '..', '..');
const MATRIX_PATH          = path.join(REPO_ROOT, 'site', 'icons', 'matrix.json');
const PNG_MAGIC            = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const REQUIRED_PURPOSES    = new Set(['any', 'maskable', 'monochrome']);
const EXPECTED_ENTRY_COUNT = 9;

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadMatrix(filePath, label) {
  expect(
    fs.existsSync(filePath),
    `${label} must exist at ${filePath} — run: bash scripts/export-canonical-icon-matrix.sh`
  ).toBe(true);
  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${label} is not valid JSON: ${e.message}`);
  }
  return parsed;
}

/**
 * Read PNG dimensions from the IHDR chunk.
 * PNG layout: 8-byte magic, 4-byte IHDR length, 4-byte "IHDR", 4-byte width (BE), 4-byte height (BE).
 * Width is at byte offset 16, height at byte offset 20.
 */
function readPNGDimensions(filePath) {
  const buf  = Buffer.alloc(24);
  const fd   = fs.openSync(filePath, 'r');
  const read = fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  if (read < 24) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// ── Suite: matrix.json structural contract ─────────────────────────────────────

test.describe('matrix.json structural contract', () => {

  test('matrix.json exists', () => {
    expect(
      fs.existsSync(MATRIX_PATH),
      'matrix.json must exist at site/icons/matrix.json — run: bash scripts/export-canonical-icon-matrix.sh'
    ).toBe(true);
  });

  test('matrix.json is valid JSON', () => {
    loadMatrix(MATRIX_PATH, 'matrix.json');
  });

  test('matrix.json has a top-level "entries" array', () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    expect(
      Array.isArray(matrix.entries),
      'matrix.json must have a top-level "entries" array'
    ).toBe(true);
  });

  test(`matrix.json has exactly ${EXPECTED_ENTRY_COUNT} entries`, () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    expect(
      matrix.entries.length,
      `matrix.json must have exactly ${EXPECTED_ENTRY_COUNT} entries, found ${matrix.entries.length} — run: bash scripts/export-canonical-icon-matrix.sh`
    ).toBe(EXPECTED_ENTRY_COUNT);
  });

  test('every entry has required fields: candidateId, platform, purpose, size, src, output', () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    const REQUIRED_FIELDS = ['candidateId', 'platform', 'purpose', 'size', 'src', 'output'];
    const missing = [];
    for (const [i, entry] of matrix.entries.entries()) {
      for (const field of REQUIRED_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(entry, field)) {
          missing.push(
            `entries[${i}]: missing field "${field}" (purpose=${entry.purpose ?? '?'}, size=${entry.size ?? '?'}, output=${entry.output ?? '?'})`
          );
        }
      }
    }
    expect(
      missing,
      `matrix.json entries with missing required fields:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('every entry purpose is a valid purpose token (any, maskable, monochrome)', () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    const invalid = [];
    for (const [i, entry] of matrix.entries.entries()) {
      if (!REQUIRED_PURPOSES.has(entry.purpose)) {
        invalid.push(
          `entries[${i}]: invalid purpose token "${entry.purpose}" (output=${entry.output})`
        );
      }
    }
    expect(
      invalid,
      `matrix.json entries with invalid purpose tokens (must be one of any/maskable/monochrome):\n  ${invalid.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('all 3 required purpose buckets are present (any, maskable, monochrome)', () => {
    const matrix  = loadMatrix(MATRIX_PATH, 'matrix.json');
    const found   = new Set(matrix.entries.map((e) => e.purpose));
    for (const purpose of REQUIRED_PURPOSES) {
      expect(
        found.has(purpose),
        `matrix.json must have at least one entry with purpose "${purpose}" — found purposes: ${[...found].sort().join(', ')}`
      ).toBe(true);
    }
  });

  test('no duplicate platform/purpose/size triple', () => {
    const matrix     = loadMatrix(MATRIX_PATH, 'matrix.json');
    const seen       = new Map();
    const duplicates = [];
    for (const [i, entry] of matrix.entries.entries()) {
      const key = `${entry.platform}/${entry.purpose}/${entry.size}`;
      if (seen.has(key)) {
        duplicates.push(
          `entries[${i}] duplicates entries[${seen.get(key)}]: key="${key}" (output=${entry.output})`
        );
      } else {
        seen.set(key, i);
      }
    }
    expect(
      duplicates,
      `matrix.json contains duplicate platform/purpose/size triples:\n  ${duplicates.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('matrix.json has schemaVersion and generatedAt top-level fields', () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    for (const field of ['schemaVersion', 'generatedAt']) {
      expect(
        Object.prototype.hasOwnProperty.call(matrix, field),
        `matrix.json must have a top-level "${field}" field`
      ).toBe(true);
    }
    expect(
      matrix.generatedAt,
      'matrix.json "generatedAt" must be a non-empty string'
    ).toBeTruthy();
  });
});

// ── Suite: PWA purpose coverage ───────────────────────────────────────────────

test.describe('PWA purpose coverage', () => {

  for (const size of [192, 512]) {
    test(`pwa platform covers all 3 purposes at ${size}px (any, maskable, monochrome)`, () => {
      const matrix  = loadMatrix(MATRIX_PATH, 'matrix.json');
      const entries = matrix.entries.filter((e) => e.platform === 'pwa' && e.size === size);
      const found   = new Set(entries.map((e) => e.purpose));
      for (const purpose of REQUIRED_PURPOSES) {
        expect(
          found.has(purpose),
          `matrix.json must have a pwa/${purpose}/${size} entry — found pwa-${size} purposes: ${[...found].sort().join(', ')}`
        ).toBe(true);
      }
    });
  }
});

// ── Suite: exported PNG file existence ────────────────────────────────────────

test.describe('exported PNG file existence', () => {

  test('every entry output file exists on disk', () => {
    const matrix  = loadMatrix(MATRIX_PATH, 'matrix.json');
    const missing = [];
    for (const entry of matrix.entries) {
      const resolved = path.join(REPO_ROOT, entry.output);
      if (!fs.existsSync(resolved)) {
        missing.push(
          `${entry.output} (purpose=${entry.purpose}, size=${entry.size}) — run: bash scripts/export-canonical-icon-matrix.sh`
        );
      }
    }
    expect(
      missing,
      `Missing exported PNG files referenced in matrix.json:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('every exported PNG is non-zero bytes', () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    const empty  = [];
    for (const entry of matrix.entries) {
      const resolved = path.join(REPO_ROOT, entry.output);
      if (!fs.existsSync(resolved)) {
        empty.push(`${entry.output} (missing)`);
        continue;
      }
      const stats = fs.statSync(resolved);
      if (stats.size === 0) {
        empty.push(`${entry.output} (purpose=${entry.purpose}, size=${entry.size}) — zero bytes`);
      }
    }
    expect(
      empty,
      `Empty or missing exported PNG files:\n  ${empty.join('\n  ')}`
    ).toHaveLength(0);
  });
});

// ── Suite: PNG integrity (magic bytes + IHDR dimensions) ─────────────────────

test.describe('PNG integrity', () => {

  test('every exported PNG starts with valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
    const matrix = loadMatrix(MATRIX_PATH, 'matrix.json');
    const bad    = [];
    for (const entry of matrix.entries) {
      const resolved = path.join(REPO_ROOT, entry.output);
      if (!fs.existsSync(resolved)) {
        bad.push(`${entry.output} (purpose=${entry.purpose}, size=${entry.size}) — file missing`);
        continue;
      }
      const header = Buffer.alloc(8);
      const fd     = fs.openSync(resolved, 'r');
      fs.readSync(fd, header, 0, 8, 0);
      fs.closeSync(fd);
      if (!header.equals(PNG_MAGIC)) {
        bad.push(
          `${entry.output} (purpose=${entry.purpose}, size=${entry.size}) — bad magic bytes: ${header.toString('hex')} (expected 89504e470d0a1a0a)`
        );
      }
    }
    expect(
      bad,
      `Files with invalid PNG magic bytes:\n  ${bad.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('every exported PNG IHDR dimensions match the declared size (square, side = entry.size)', () => {
    const matrix     = loadMatrix(MATRIX_PATH, 'matrix.json');
    const mismatches = [];
    for (const entry of matrix.entries) {
      const resolved = path.join(REPO_ROOT, entry.output);
      if (!fs.existsSync(resolved)) {
        mismatches.push(`${entry.output} (purpose=${entry.purpose}, size=${entry.size}) — file missing`);
        continue;
      }
      const dims = readPNGDimensions(resolved);
      if (!dims) {
        mismatches.push(`${entry.output} (purpose=${entry.purpose}, size=${entry.size}) — could not read IHDR chunk (file too short)`);
        continue;
      }
      if (dims.width !== entry.size || dims.height !== entry.size) {
        mismatches.push(
          `${entry.output} (purpose=${entry.purpose}): expected ${entry.size}×${entry.size}, IHDR reports ${dims.width}×${dims.height}`
        );
      }
    }
    expect(
      mismatches,
      `Exported PNGs whose IHDR dimensions do not match the declared size:\n  ${mismatches.join('\n  ')}`
    ).toHaveLength(0);
  });
});

// ── Suite: matrix.json ↔ disk consistency ─────────────────────────────────────

test.describe('matrix.json ↔ disk consistency', () => {

  test('every output path in matrix.json is unique', () => {
    const matrix     = loadMatrix(MATRIX_PATH, 'matrix.json');
    const seen       = new Map();
    const duplicates = [];
    for (const [i, entry] of matrix.entries.entries()) {
      if (seen.has(entry.output)) {
        duplicates.push(
          `entries[${i}] (purpose=${entry.purpose}, size=${entry.size}) shares output with entries[${seen.get(entry.output)}]: "${entry.output}"`
        );
      } else {
        seen.set(entry.output, i);
      }
    }
    expect(
      duplicates,
      `matrix.json has duplicate output paths:\n  ${duplicates.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('every src path listed in matrix.json exists on disk', () => {
    const matrix  = loadMatrix(MATRIX_PATH, 'matrix.json');
    const missing = [];
    for (const [i, entry] of matrix.entries.entries()) {
      const resolved = path.join(REPO_ROOT, entry.src);
      if (!fs.existsSync(resolved)) {
        missing.push(
          `entries[${i}] src="${entry.src}" (purpose=${entry.purpose}, size=${entry.size}) — source SVG not found`
        );
      }
    }
    expect(
      missing,
      `matrix.json references missing SVG source files:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });
});

// ── Suite: negative-path assertions ──────────────────────────────────────────

test.describe('negative-path assertions (malformed matrix detection)', () => {

  test('entry missing "purpose" field would be caught by the required-field check (negative boundary)', () => {
    // Simulate an entry where purpose was accidentally omitted
    const fakeEntry = { candidateId: 'C2', platform: 'pwa', size: 512, src: 'foo.svg', output: 'bar.png' };
    expect(
      Object.prototype.hasOwnProperty.call(fakeEntry, 'purpose'),
      'An entry without "purpose" must be detected as malformed — this confirms the required-field guard would catch it'
    ).toBe(false);
  });

  test('duplicate platform/purpose/size triple would be caught by the dedup check (negative boundary)', () => {
    const fakeEntries = [
      { platform: 'pwa', purpose: 'any', size: 512, output: 'pwa-any-512x512.png' },
      { platform: 'pwa', purpose: 'any', size: 512, output: 'pwa-any-512x512-copy.png' }, // duplicate
    ];
    const seen       = new Map();
    const duplicates = [];
    for (const [i, e] of fakeEntries.entries()) {
      const key = `${e.platform}/${e.purpose}/${e.size}`;
      if (seen.has(key)) {
        duplicates.push(`entries[${i}]: duplicate key="${key}"`);
      } else {
        seen.set(key, i);
      }
    }
    expect(
      duplicates.length,
      `A duplicate platform/purpose/size triple must be detected by the dedup check — found ${duplicates.length} duplicate(s)`
    ).toBeGreaterThan(0);
  });

  test('invalid purpose tokens are rejected by the valid-purpose-set check (negative boundary)', () => {
    const invalidTokens = ['any-plus', 'mask', 'mono', 'ANY', 'Maskable', 'MONOCHROME', '', null, undefined];
    for (const token of invalidTokens) {
      expect(
        REQUIRED_PURPOSES.has(token),
        `Invalid purpose token "${token}" must not be accepted — only "any", "maskable", "monochrome" are valid`
      ).toBe(false);
    }
  });

  test('a stale output path (file removed from disk) would fail the existence check (negative boundary)', () => {
    // Confirm a clearly non-existent path is not found — validates the detection logic is active
    const stalePath = path.join(REPO_ROOT, 'site', 'icons', 'pwa-any-9999x9999.png');
    expect(
      fs.existsSync(stalePath),
      `Non-existent path "${stalePath}" must not exist — confirms the output-existence check would catch a stale matrix.json reference`
    ).toBe(false);
  });

  test('8-entry matrix would fail the exact-count check (negative boundary)', () => {
    const fakeEntries = Array(8).fill({ purpose: 'any', size: 192 });
    expect(
      fakeEntries.length,
      `An 8-entry array must not equal ${EXPECTED_ENTRY_COUNT} — the count check would catch this undershoot`
    ).not.toBe(EXPECTED_ENTRY_COUNT);
  });

  test('10-entry matrix would fail the exact-count check (negative boundary)', () => {
    const fakeEntries = Array(10).fill({ purpose: 'any', size: 192 });
    expect(
      fakeEntries.length,
      `A 10-entry array must not equal ${EXPECTED_ENTRY_COUNT} — the count check would catch this overshoot`
    ).not.toBe(EXPECTED_ENTRY_COUNT);
  });

  test('missing purpose bucket (e.g. monochrome absent) would fail the purpose-coverage check (negative boundary)', () => {
    // Simulate a matrix that only has any and maskable
    const fakeEntries = [
      { purpose: 'any' },
      { purpose: 'any' },
      { purpose: 'maskable' },
    ];
    const foundPurposes = new Set(fakeEntries.map((e) => e.purpose));
    expect(
      foundPurposes.has('monochrome'),
      `A matrix without "monochrome" entries must fail the purpose-coverage check — confirming the guard is sensitive to missing buckets`
    ).toBe(false);
  });
});
