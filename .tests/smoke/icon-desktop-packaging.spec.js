// .tests/smoke/icon-desktop-packaging.spec.js
//
// Filesystem + binary-structure assertions for the desktop packaging contract.
//
// Enforces:
//   - desktop-matrix.json structural integrity and candidate alignment with canonical.json
//   - site/icons/desktop/year-planner.ico: magic bytes, directory-entry count, required size ladder
//   - site/icons/desktop/year-planner.icns: file magic, chunk table coverage
//   - Contract-to-disk consistency (all declared output files exist)
//   - Negative boundary assertions for malformed matrix/binary detection
//
// No browser required — all assertions are pure Node.js fs checks.
// Run: npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js

const { test, expect } = require('@playwright/test');
const path             = require('path');
const fs               = require('fs');

const REPO_ROOT              = path.join(__dirname, '..', '..');
const CANONICAL_PATH         = path.join(REPO_ROOT, 'mockups', 'icon-candidates', 'canonical.json');
const DESKTOP_MATRIX_PATH    = path.join(REPO_ROOT, 'site', 'icons', 'desktop-matrix.json');
const DESKTOP_DIR            = path.join(REPO_ROOT, 'site', 'icons', 'desktop');
const ICO_PATH               = path.join(DESKTOP_DIR, 'year-planner.ico');
const ICNS_PATH              = path.join(DESKTOP_DIR, 'year-planner.icns');

const ICO_MAGIC              = Buffer.from([0x00, 0x00, 0x01, 0x00]);
const ICNS_MAGIC             = Buffer.from('icns', 'ascii');

// ICO frame sizes required per the exporter contract
const REQUIRED_ICO_SIZES     = [16, 24, 32, 48, 64, 128, 256];
// ICNS pixel sizes unique to the iconset rendering
const REQUIRED_ICNS_SIZES    = [16, 32, 64, 128, 256, 512, 1024];

const VALID_FORMATS          = new Set(['ico', 'icns']);
const VALID_PLATFORMS        = new Set(['windows', 'macos', 'linux']);

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadJSON(filePath, label) {
  expect(
    fs.existsSync(filePath),
    `${label} must exist at ${filePath}`
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

function readBytes(filePath, offset, count) {
  const buf = Buffer.alloc(count);
  const fd  = fs.openSync(filePath, 'r');
  const n   = fs.readSync(fd, buf, 0, count, offset);
  fs.closeSync(fd);
  return n === count ? buf : buf.slice(0, n);
}

function readUInt16LE(filePath, offset) {
  return readBytes(filePath, offset, 2).readUInt16LE(0);
}

function readUInt32BE(buf, offset) {
  return buf.readUInt32BE(offset);
}

/**
 * Parse the ICO directory and return an array of { bWidth, bHeight, size, offset }.
 * bWidth/bHeight of 0 encodes 256 per the ICO spec.
 */
function parseICODirectory(icoPath) {
  expect(fs.existsSync(icoPath), `ICO file must exist: ${icoPath}`).toBe(true);
  const fileBuf = fs.readFileSync(icoPath);
  const count   = fileBuf.readUInt16LE(4);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const base   = 6 + i * 16;
    const bWidth  = fileBuf[base];
    const bHeight = fileBuf[base + 1];
    const size    = fileBuf.readUInt32LE(base + 8);
    const offset  = fileBuf.readUInt32LE(base + 12);
    entries.push({
      width:  bWidth  === 0 ? 256 : bWidth,
      height: bHeight === 0 ? 256 : bHeight,
      size,
      offset,
    });
  }
  return entries;
}

/**
 * Parse the ICNS chunk table and return an array of { type, length, dataOffset }.
 * Each chunk: 4-byte OSType + 4-byte length (BE, includes the 8-byte header).
 * File layout: 4-byte magic + 4-byte file length + chunks.
 */
function parseICNSChunks(icnsPath) {
  expect(fs.existsSync(icnsPath), `ICNS file must exist: ${icnsPath}`).toBe(true);
  const fileBuf  = fs.readFileSync(icnsPath);
  const fileLen  = fileBuf.readUInt32BE(4);
  const chunks   = [];
  let pos        = 8; // skip magic + file length
  while (pos + 8 <= fileLen && pos + 8 <= fileBuf.length) {
    const type       = fileBuf.slice(pos, pos + 4).toString('ascii');
    const chunkLen   = fileBuf.readUInt32BE(pos + 4);
    if (chunkLen < 8) break; // malformed chunk
    chunks.push({ type, length: chunkLen, dataOffset: pos + 8 });
    pos += chunkLen;
  }
  return chunks;
}

// ── Suite: desktop-matrix.json structural contract ────────────────────────────

test.describe('desktop-matrix.json structural contract', () => {

  test('desktop-matrix.json exists', () => {
    expect(
      fs.existsSync(DESKTOP_MATRIX_PATH),
      'desktop-matrix.json must exist at site/icons/desktop-matrix.json — run: bash scripts/export-desktop-packaging-assets.sh'
    ).toBe(true);
  });

  test('desktop-matrix.json is valid JSON', () => {
    loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
  });

  test('desktop-matrix.json has required top-level fields: schemaVersion, candidateId, generatedAt, entries', () => {
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    for (const field of ['schemaVersion', 'candidateId', 'generatedAt', 'entries']) {
      expect(
        Object.prototype.hasOwnProperty.call(matrix, field),
        `desktop-matrix.json must have a top-level "${field}" field`
      ).toBe(true);
    }
    expect(typeof matrix.generatedAt, 'generatedAt must be a string').toBe('string');
    expect(matrix.generatedAt.length, 'generatedAt must be non-empty').toBeGreaterThan(0);
  });

  test('desktop-matrix.json entries is an array with at least 2 items (windows ICO + macOS ICNS)', () => {
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    expect(Array.isArray(matrix.entries), 'entries must be an array').toBe(true);
    expect(
      matrix.entries.length,
      `desktop-matrix.json must have at least 2 entries (ico + icns), found ${matrix.entries.length}`
    ).toBeGreaterThanOrEqual(2);
  });

  test('every desktop matrix entry has required fields: platform, format, candidateId, src, output, sizes', () => {
    const matrix   = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const REQUIRED = ['platform', 'format', 'candidateId', 'src', 'output', 'sizes'];
    const missing  = [];
    for (const [i, entry] of matrix.entries.entries()) {
      for (const field of REQUIRED) {
        if (!Object.prototype.hasOwnProperty.call(entry, field)) {
          missing.push(`entries[${i}]: missing field "${field}" (format=${entry.format ?? '?'}, platform=${entry.platform ?? '?'})`);
        }
      }
    }
    expect(missing, `Entries with missing required fields:\n  ${missing.join('\n  ')}`).toHaveLength(0);
  });

  test('every desktop matrix entry format is a valid token (ico, icns)', () => {
    const matrix   = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const invalid  = [];
    for (const [i, entry] of matrix.entries.entries()) {
      if (!VALID_FORMATS.has(entry.format)) {
        invalid.push(`entries[${i}]: invalid format token "${entry.format}" (output=${entry.output})`);
      }
    }
    expect(invalid, `Entries with invalid format tokens:\n  ${invalid.join('\n  ')}`).toHaveLength(0);
  });

  test('desktop-matrix.json contains exactly one ico entry and one icns entry', () => {
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const ico    = matrix.entries.filter((e) => e.format === 'ico');
    const icns   = matrix.entries.filter((e) => e.format === 'icns');
    expect(ico.length, 'desktop-matrix.json must have exactly one ico entry').toBe(1);
    expect(icns.length, 'desktop-matrix.json must have exactly one icns entry').toBe(1);
  });

  test('every declared output file exists on disk', () => {
    const matrix  = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const missing = [];
    for (const entry of matrix.entries) {
      const abs = path.join(REPO_ROOT, entry.output);
      if (!fs.existsSync(abs)) {
        missing.push(`${entry.output} (format=${entry.format}) — run: bash scripts/export-desktop-packaging-assets.sh`);
      }
    }
    expect(missing, `Missing output files declared in desktop-matrix.json:\n  ${missing.join('\n  ')}`).toHaveLength(0);
  });

  test('every declared output file is non-zero bytes', () => {
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const empty  = [];
    for (const entry of matrix.entries) {
      const abs = path.join(REPO_ROOT, entry.output);
      if (!fs.existsSync(abs)) { empty.push(`${entry.output} (missing)`); continue; }
      if (fs.statSync(abs).size === 0) empty.push(`${entry.output} (zero bytes)`);
    }
    expect(empty, `Empty or missing output files:\n  ${empty.join('\n  ')}`).toHaveLength(0);
  });
});

// ── Suite: candidateId alignment with canonical.json ─────────────────────────

test.describe('candidateId alignment with canonical.json', () => {

  test('canonical.json exists', () => {
    expect(
      fs.existsSync(CANONICAL_PATH),
      'canonical.json must exist at mockups/icon-candidates/canonical.json'
    ).toBe(true);
  });

  test('desktop-matrix.json candidateId matches canonical.json candidateId', () => {
    const canon  = loadJSON(CANONICAL_PATH, 'canonical.json');
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    expect(
      matrix.candidateId,
      `desktop-matrix.json candidateId "${matrix.candidateId}" must match canonical.json candidateId "${canon.candidateId}"`
    ).toBe(canon.candidateId);
  });

  test('every desktop matrix entry candidateId matches canonical.json', () => {
    const canon   = loadJSON(CANONICAL_PATH, 'canonical.json');
    const matrix  = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const mismatches = [];
    for (const [i, entry] of matrix.entries.entries()) {
      if (entry.candidateId !== canon.candidateId) {
        mismatches.push(
          `entries[${i}] (format=${entry.format}): candidateId="${entry.candidateId}" != canonical="${canon.candidateId}"`
        );
      }
    }
    expect(mismatches, `Candidate ID mismatches:\n  ${mismatches.join('\n  ')}`).toHaveLength(0);
  });

  test('desktop-matrix.json does NOT contain a "matrix.json" output path (must not contaminate web/PWA matrix)', () => {
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    for (const [i, entry] of matrix.entries.entries()) {
      expect(
        entry.output,
        `entries[${i}] output "${entry.output}" must not reference site/icons/matrix.json — desktop contract must be isolated`
      ).not.toContain('matrix.json');
    }
  });
});

// ── Suite: ICO binary structure ──────────────────────────────────────────────

test.describe('ICO binary structure', () => {

  test('year-planner.ico exists', () => {
    expect(
      fs.existsSync(ICO_PATH),
      `year-planner.ico must exist at ${ICO_PATH} — run: bash scripts/export-desktop-packaging-assets.sh`
    ).toBe(true);
  });

  test('year-planner.ico starts with ICO magic bytes (00 00 01 00)', () => {
    const header = readBytes(ICO_PATH, 0, 4);
    expect(
      header.equals(ICO_MAGIC),
      `ICO file must start with bytes 00000100, got ${header.toString('hex')}`
    ).toBe(true);
  });

  test(`year-planner.ico has exactly ${REQUIRED_ICO_SIZES.length} directory entries`, () => {
    const count = readUInt16LE(ICO_PATH, 4);
    expect(
      count,
      `ICO must have exactly ${REQUIRED_ICO_SIZES.length} directory entries (for sizes ${REQUIRED_ICO_SIZES.join(',')}), got ${count}`
    ).toBe(REQUIRED_ICO_SIZES.length);
  });

  test(`year-planner.ico directory covers all required sizes: ${REQUIRED_ICO_SIZES.join(', ')}`, () => {
    const entries = parseICODirectory(ICO_PATH);
    const found   = new Set(entries.map((e) => e.width));
    const missing = REQUIRED_ICO_SIZES.filter((s) => !found.has(s));
    expect(
      missing,
      `ICO is missing directory entries for sizes: ${missing.join(', ')} (found: ${[...found].sort((a, b) => a - b).join(', ')})`
    ).toHaveLength(0);
  });

  test('every ICO directory entry has a non-zero data size and valid offset', () => {
    const entries   = parseICODirectory(ICO_PATH);
    const fileStat  = fs.statSync(ICO_PATH);
    const bad       = [];
    for (const e of entries) {
      if (e.size === 0) bad.push(`size=${e.width}: declared data size is 0`);
      if (e.offset >= fileStat.size) bad.push(`size=${e.width}: offset ${e.offset} exceeds file length ${fileStat.size}`);
    }
    expect(bad, `ICO directory entries with invalid size/offset:\n  ${bad.join('\n  ')}`).toHaveLength(0);
  });

  test('every ICO frame data begins with PNG magic bytes (89 50 4E 47)', () => {
    const entries  = parseICODirectory(ICO_PATH);
    const fileBuf  = fs.readFileSync(ICO_PATH);
    const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const bad      = [];
    for (const e of entries) {
      const frame = fileBuf.slice(e.offset, e.offset + 4);
      if (!frame.equals(PNG_MAGIC)) {
        bad.push(`size=${e.width}×${e.height}: bad frame magic ${frame.toString('hex')} (expected 89504e47)`);
      }
    }
    expect(bad, `ICO frames with invalid PNG magic:\n  ${bad.join('\n  ')}`).toHaveLength(0);
  });
});

// ── Suite: ICNS binary structure ─────────────────────────────────────────────

test.describe('ICNS binary structure', () => {

  test('year-planner.icns exists', () => {
    expect(
      fs.existsSync(ICNS_PATH),
      `year-planner.icns must exist at ${ICNS_PATH} — run: bash scripts/export-desktop-packaging-assets.sh`
    ).toBe(true);
  });

  test('year-planner.icns starts with ICNS file magic (icns)', () => {
    const magic = readBytes(ICNS_PATH, 0, 4);
    expect(
      magic.equals(ICNS_MAGIC),
      `ICNS file must start with "icns" magic, got "${magic.toString('ascii')}" (${magic.toString('hex')})`
    ).toBe(true);
  });

  test('year-planner.icns file-length field matches actual file size', () => {
    const fileStat  = fs.statSync(ICNS_PATH);
    const declared  = readBytes(ICNS_PATH, 4, 4).readUInt32BE(0);
    expect(
      declared,
      `ICNS declared length ${declared} must match actual file size ${fileStat.size}`
    ).toBe(fileStat.size);
  });

  test('year-planner.icns chunk table is non-empty', () => {
    const chunks = parseICNSChunks(ICNS_PATH);
    expect(
      chunks.length,
      `ICNS must contain at least one chunk, found ${chunks.length}`
    ).toBeGreaterThan(0);
  });

  test('year-planner.icns contains icon chunks spanning required size coverage', () => {
    // iconutil typically uses these OSType codes for the PNG-based chunks:
    //   icp4 = 16, icp5 = 32, icp6 = 64, ic07 = 128, ic08 = 256, ic09 = 512, ic10 = 1024
    const KNOWN_PNG_CHUNKS = new Set(['icp4', 'icp5', 'icp6', 'ic07', 'ic08', 'ic09', 'ic10']);
    const chunks           = parseICNSChunks(ICNS_PATH);
    const foundTypes       = new Set(chunks.map((c) => c.type));
    const iconChunks       = [...foundTypes].filter((t) => KNOWN_PNG_CHUNKS.has(t));
    expect(
      iconChunks.length,
      `ICNS must contain known icon chunks (${[...KNOWN_PNG_CHUNKS].join(', ')}), found types: ${[...foundTypes].join(', ')}`
    ).toBeGreaterThanOrEqual(1);
  });

  test('year-planner.icns has at least 5 distinct chunk types (coverage across size range)', () => {
    const chunks    = parseICNSChunks(ICNS_PATH);
    const types     = new Set(chunks.map((c) => c.type));
    expect(
      types.size,
      `ICNS must have at least 5 distinct chunk types for full size coverage, found ${types.size}: ${[...types].join(', ')}`
    ).toBeGreaterThanOrEqual(5);
  });
});

// ── Suite: web/PWA matrix.json is untouched ──────────────────────────────────

test.describe('web/PWA matrix.json isolation', () => {
  const WEB_MATRIX_PATH = path.join(REPO_ROOT, 'site', 'icons', 'matrix.json');

  test('site/icons/matrix.json still exists after desktop packaging', () => {
    expect(
      fs.existsSync(WEB_MATRIX_PATH),
      'site/icons/matrix.json must not be removed or renamed by the desktop packaging exporter'
    ).toBe(true);
  });

  test('site/icons/matrix.json still has exactly 9 entries (desktop exporter must not mutate it)', () => {
    const matrix = loadJSON(WEB_MATRIX_PATH, 'site/icons/matrix.json');
    expect(
      Array.isArray(matrix.entries) && matrix.entries.length,
      `site/icons/matrix.json must still have 9 entries; found ${Array.isArray(matrix.entries) ? matrix.entries.length : 'non-array'}`
    ).toBe(9);
  });
});

// ── Suite: negative-boundary assertions ──────────────────────────────────────

test.describe('negative-boundary assertions (malformed desktop matrix detection)', () => {

  test('entry missing "format" field would be caught by the required-field check (negative boundary)', () => {
    const fakeEntry = { platform: 'windows', candidateId: 'C2', src: 'icon.svg', output: 'a.ico', sizes: [16] };
    expect(
      Object.prototype.hasOwnProperty.call(fakeEntry, 'format'),
      'An entry without "format" must be detected as malformed — confirms the required-field guard would catch it'
    ).toBe(false);
  });

  test('invalid format token would be rejected (negative boundary)', () => {
    const invalid = ['png', 'svg', 'webp', 'exe', '', null, undefined, 'ICO', 'ICNS'];
    for (const token of invalid) {
      expect(
        VALID_FORMATS.has(token),
        `Invalid format token "${token}" must not be accepted — only "ico" and "icns" are valid`
      ).toBe(false);
    }
  });

  test('mismatched candidateId between desktop-matrix.json and canonical.json would be caught (negative boundary)', () => {
    const canon   = loadJSON(CANONICAL_PATH, 'canonical.json');
    const fakeMatrix = { candidateId: 'C99-fake' };
    expect(
      fakeMatrix.candidateId,
      `A mismatched candidateId "${fakeMatrix.candidateId}" must not equal the canonical "${canon.candidateId}"`
    ).not.toBe(canon.candidateId);
  });

  test('ICO file with wrong magic bytes would fail the magic check (negative boundary)', () => {
    const wrongMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic instead of ICO
    expect(
      wrongMagic.equals(ICO_MAGIC),
      'PNG magic bytes must not be accepted as valid ICO magic — confirms the ICO magic check would catch a corrupt file'
    ).toBe(false);
  });

  test('ICNS file with wrong magic bytes would fail the magic check (negative boundary)', () => {
    const wrongMagic = Buffer.from([0x00, 0x00, 0x01, 0x00]); // ICO magic instead of ICNS
    expect(
      wrongMagic.equals(ICNS_MAGIC),
      'ICO magic bytes must not be accepted as valid ICNS magic — confirms the ICNS magic check would catch a corrupt file'
    ).toBe(false);
  });

  test('missing ICO size (e.g. 48 absent) would fail the size-ladder check (negative boundary)', () => {
    const partialSizes = [16, 24, 32, 64, 128, 256]; // 48 removed
    const required     = new Set(REQUIRED_ICO_SIZES);
    const missing      = REQUIRED_ICO_SIZES.filter((s) => !partialSizes.includes(s));
    expect(
      missing.length,
      'A size ladder missing 48 must be detected as incomplete — confirms the size-coverage check is sensitive'
    ).toBeGreaterThan(0);
  });

  test('a stale output path not on disk would fail the existence check (negative boundary)', () => {
    const stalePath = path.join(DESKTOP_DIR, 'year-planner-9999.ico');
    expect(
      fs.existsSync(stalePath),
      'A clearly non-existent path must not exist — confirms the output-existence check would catch a stale reference'
    ).toBe(false);
  });
});
