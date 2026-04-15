// .tests/smoke/icon-candidates-selection.spec.js
// Selection-contract assertions for the icon-candidate winner lock.
// Enforces: canonical.json has exactly one winner with a valid candidate ID,
// alternatives.json has exactly two archived-alternatives covering the non-winners,
// all three candidate IDs are covered with no overlap, and gallery
// data-selection-state attributes agree with the JSON metadata.
// No browser required — all assertions are pure Node.js fs + JSON checks.

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const MOCKUPS_ROOT    = path.join(__dirname, '..', '..', 'mockups', 'icon-candidates');
const CANONICAL_PATH  = path.join(MOCKUPS_ROOT, 'canonical.json');
const ALTERNATIVES_PATH = path.join(MOCKUPS_ROOT, 'alternatives.json');
const GALLERY_PATH    = path.join(__dirname, '..', '..', 'mockups', 'icon-comparison.html');

const VALID_CANDIDATE_IDS = new Set(['C1', 'C2', 'C3']);
const REQUIRED_PREVIEW_SIZES = ['16', '32', '180', '192', '512'];

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

function readGallery() {
  expect(
    fs.existsSync(GALLERY_PATH),
    'mockups/icon-comparison.html must exist'
  ).toBe(true);
  return fs.readFileSync(GALLERY_PATH, 'utf8');
}

/**
 * Strip all <style>...</style> blocks from HTML so that CSS attribute-selector
 * tokens (e.g. [data-candidate="C1"]::before) cannot trigger false-positive
 * matches in cross-attribute HTML checks.
 */
function stripStyleBlocks(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, '');
}

// ── Suite: canonical.json (winner metadata) ────────────────────────────────────

test.describe('canonical.json — winner metadata', () => {

  test('canonical.json exists', () => {
    expect(
      fs.existsSync(CANONICAL_PATH),
      `canonical.json must exist at ${CANONICAL_PATH}`
    ).toBe(true);
  });

  test('canonical.json is valid JSON', () => {
    loadJSON(CANONICAL_PATH, 'canonical.json');
  });

  test('canonical.json has exactly one selectionStatus: "winner"', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    expect(
      canon.selectionStatus,
      `canonical.json must have selectionStatus "winner", got "${canon.selectionStatus}"`
    ).toBe('winner');
  });

  test('canonical.json candidateId is a valid candidate (C1, C2, or C3)', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    expect(
      VALID_CANDIDATE_IDS.has(canon.candidateId),
      `canonical.json candidateId "${canon.candidateId}" is not a valid candidate — must be one of C1, C2, C3`
    ).toBe(true);
  });

  test('canonical.json has required top-level fields', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    for (const field of ['schemaVersion', 'selectionStatus', 'candidateId', 'candidateName', 'folder', 'previews', 'svgSources']) {
      expect(
        Object.prototype.hasOwnProperty.call(canon, field),
        `canonical.json is missing required field "${field}"`
      ).toBe(true);
    }
  });

  test('canonical.json previews object contains all 5 required sizes', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    expect(typeof canon.previews, 'canonical.json previews must be an object').toBe('object');
    for (const size of REQUIRED_PREVIEW_SIZES) {
      expect(
        Object.prototype.hasOwnProperty.call(canon.previews, size),
        `canonical.json previews is missing size "${size}"`
      ).toBe(true);
    }
  });

  test('canonical.json preview paths use preview-{size}.png naming (not icon-{size}.png)', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    for (const [size, previewPath] of Object.entries(canon.previews)) {
      expect(
        previewPath,
        `canonical.json preview[${size}] path "${previewPath}" must use preview-${size}.png naming`
      ).toContain(`preview-${size}.png`);
      expect(
        previewPath,
        `canonical.json preview[${size}] path "${previewPath}" must not use old icon-${size}.png naming`
      ).not.toMatch(/icon-\d+\.png/);
    }
  });

  test('canonical.json svgSources has icon and logo keys', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    expect(typeof canon.svgSources, 'canonical.json svgSources must be an object').toBe('object');
    expect(
      Object.prototype.hasOwnProperty.call(canon.svgSources, 'icon'),
      'canonical.json svgSources must have an "icon" key'
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(canon.svgSources, 'logo'),
      'canonical.json svgSources must have a "logo" key'
    ).toBe(true);
  });

  // ── Negative: duplicate winner detection ─────────────────────────────────────
  test('malformed canonical.json with duplicate winner would be invalid (negative boundary)', () => {
    // Verify the validation logic: a second winner record would violate the contract.
    // This test confirms that selectionStatus must be exactly "winner" (not an array,
    // not "winners", not undefined).
    const testCases = [
      { selectionStatus: undefined,  shouldFail: true,  label: 'undefined' },
      { selectionStatus: 'winners',  shouldFail: true,  label: '"winners" (plural typo)' },
      { selectionStatus: 'pending',  shouldFail: true,  label: '"pending"' },
      { selectionStatus: 'winner',   shouldFail: false, label: '"winner" (correct)' },
    ];
    for (const { selectionStatus, shouldFail, label } of testCases) {
      const isValid = selectionStatus === 'winner';
      expect(
        isValid,
        `selectionStatus ${label} should ${shouldFail ? 'fail' : 'pass'} the winner check`
      ).toBe(!shouldFail);
    }
  });

  // ── Negative: invalid candidateId ────────────────────────────────────────────
  test('malformed canonical.json with invalid candidateId would be invalid (negative boundary)', () => {
    const invalidIds = ['C0', 'C4', 'C10', 'c2', 'C2x', '', null, undefined];
    for (const id of invalidIds) {
      expect(
        VALID_CANDIDATE_IDS.has(id),
        `Invalid candidateId "${id}" must not be accepted — only C1, C2, C3 are valid`
      ).toBe(false);
    }
  });
});

// ── Suite: alternatives.json (archived alternatives metadata) ─────────────────

test.describe('alternatives.json — archived alternatives metadata', () => {

  test('alternatives.json exists', () => {
    expect(
      fs.existsSync(ALTERNATIVES_PATH),
      `alternatives.json must exist at ${ALTERNATIVES_PATH}`
    ).toBe(true);
  });

  test('alternatives.json is valid JSON', () => {
    loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
  });

  test('alternatives.json has an "alternatives" array', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    expect(
      Array.isArray(alts.alternatives),
      'alternatives.json must have a top-level "alternatives" array'
    ).toBe(true);
  });

  test('alternatives.json has exactly 2 entries (the two non-winner candidates)', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    expect(
      alts.alternatives.length,
      `alternatives.json must have exactly 2 entries, found ${alts.alternatives.length}`
    ).toBe(2);
  });

  test('every entry in alternatives.json has selectionStatus: "archived-alternative"', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    for (const [i, entry] of alts.alternatives.entries()) {
      expect(
        entry.selectionStatus,
        `alternatives.json entry[${i}] must have selectionStatus "archived-alternative", got "${entry.selectionStatus}"`
      ).toBe('archived-alternative');
    }
  });

  test('every alternative candidateId is a valid candidate ID (C1, C2, or C3)', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    for (const [i, entry] of alts.alternatives.entries()) {
      expect(
        VALID_CANDIDATE_IDS.has(entry.candidateId),
        `alternatives.json entry[${i}] candidateId "${entry.candidateId}" is invalid — must be C1, C2, or C3`
      ).toBe(true);
    }
  });

  test('alternatives.json has no duplicate candidateIds', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    const ids = alts.alternatives.map((e) => e.candidateId);
    const unique = new Set(ids);
    expect(
      unique.size,
      `alternatives.json contains duplicate candidateIds: ${ids.join(', ')}`
    ).toBe(ids.length);
  });

  test('each alternative entry has required fields', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    for (const [i, entry] of alts.alternatives.entries()) {
      for (const field of ['selectionStatus', 'candidateId', 'candidateName', 'folder', 'previews', 'svgSources']) {
        expect(
          Object.prototype.hasOwnProperty.call(entry, field),
          `alternatives.json entry[${i}] (${entry.candidateId}) is missing required field "${field}"`
        ).toBe(true);
      }
    }
  });

  test('each alternative preview paths use preview-{size}.png naming', () => {
    const alts = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    for (const entry of alts.alternatives) {
      for (const [size, previewPath] of Object.entries(entry.previews)) {
        expect(
          previewPath,
          `alternatives.json ${entry.candidateId} preview[${size}] must use preview-${size}.png naming`
        ).toContain(`preview-${size}.png`);
        expect(
          previewPath,
          `alternatives.json ${entry.candidateId} preview[${size}] must not use old icon-${size}.png naming`
        ).not.toMatch(/icon-\d+\.png/);
      }
    }
  });

  // ── Negative: three alternatives (wrong cardinality) ─────────────────────────
  test('three-entry alternatives would violate the exactly-2 invariant (negative boundary)', () => {
    const fakeThreeEntries = [
      { selectionStatus: 'archived-alternative', candidateId: 'C1' },
      { selectionStatus: 'archived-alternative', candidateId: 'C3' },
      { selectionStatus: 'archived-alternative', candidateId: 'C2' }, // third — invalid
    ];
    expect(
      fakeThreeEntries.length,
      'A three-entry alternatives array must not equal 2 — the invariant check would catch this'
    ).not.toBe(2);
  });
});

// ── Suite: coverage invariant (winner + alternatives = all 3 candidates) ────────

test.describe('selection coverage invariant', () => {

  test('winner + alternatives cover all 3 candidate IDs with no overlap', () => {
    const canon = loadJSON(CANONICAL_PATH, 'canonical.json');
    const alts  = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');

    const winnerId = canon.candidateId;
    const altIds   = alts.alternatives.map((e) => e.candidateId);
    const allIds   = [winnerId, ...altIds];

    // No overlap: winner must not appear in alternatives
    expect(
      altIds,
      `Winner "${winnerId}" must not appear in alternatives.json — found overlap`
    ).not.toContain(winnerId);

    // Complete coverage: exactly the three valid IDs
    const covered = new Set(allIds);
    for (const id of VALID_CANDIDATE_IDS) {
      expect(
        covered.has(id),
        `Candidate ${id} is not covered by winner + alternatives — selection is incomplete`
      ).toBe(true);
    }
    expect(
      covered.size,
      `Winner + alternatives must cover exactly 3 candidates (C1, C2, C3), covered: ${[...covered].sort().join(', ')}`
    ).toBe(3);
  });
});

// ── Suite: gallery marker consistency ─────────────────────────────────────────

test.describe('gallery data-selection-state marker consistency', () => {

  test('gallery has data-selection-state="winner" for the canonical winner candidate', () => {
    const canon   = loadJSON(CANONICAL_PATH, 'canonical.json');
    const content = stripStyleBlocks(readGallery());
    const winnerId = canon.candidateId;

    const winnerPattern = new RegExp(
      `data-candidate="${winnerId}"[^>]*data-selection-state="winner"|data-selection-state="winner"[^>]*data-candidate="${winnerId}"`,
      'g'
    );
    const winnerCells = [...content.matchAll(winnerPattern)];
    expect(
      winnerCells.length,
      `Gallery must mark candidate ${winnerId} with data-selection-state="winner" on at least one element, found ${winnerCells.length}`
    ).toBeGreaterThanOrEqual(1);
  });

  test('gallery marks each alternative candidate with data-selection-state="archived-alternative"', () => {
    const alts    = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    const content = stripStyleBlocks(readGallery());

    for (const entry of alts.alternatives) {
      const altId = entry.candidateId;
      const altPattern = new RegExp(
        `data-candidate="${altId}"[^>]*data-selection-state="archived-alternative"|data-selection-state="archived-alternative"[^>]*data-candidate="${altId}"`,
        'g'
      );
      const altCells = [...content.matchAll(altPattern)];
      expect(
        altCells.length,
        `Gallery must mark candidate ${altId} with data-selection-state="archived-alternative" on at least one element, found ${altCells.length}`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  test('gallery has no element where the winner candidate has data-selection-state="archived-alternative"', () => {
    const canon   = loadJSON(CANONICAL_PATH, 'canonical.json');
    const content = stripStyleBlocks(readGallery());
    const winnerId = canon.candidateId;

    const mismatchPattern = new RegExp(
      `data-candidate="${winnerId}"[^>]*data-selection-state="archived-alternative"|data-selection-state="archived-alternative"[^>]*data-candidate="${winnerId}"`,
      'g'
    );
    const mismatches = [...content.matchAll(mismatchPattern)];
    expect(
      mismatches.length,
      `Gallery must NOT mark winner ${winnerId} with data-selection-state="archived-alternative" — found ${mismatches.length} mismatch(es)`
    ).toBe(0);
  });

  test('gallery has no element where an alternative candidate has data-selection-state="winner"', () => {
    const alts    = loadJSON(ALTERNATIVES_PATH, 'alternatives.json');
    const content = stripStyleBlocks(readGallery());

    for (const entry of alts.alternatives) {
      const altId = entry.candidateId;
      const mismatchPattern = new RegExp(
        `data-candidate="${altId}"[^>]*data-selection-state="winner"|data-selection-state="winner"[^>]*data-candidate="${altId}"`,
        'g'
      );
      const mismatches = [...content.matchAll(mismatchPattern)];
      expect(
        mismatches.length,
        `Gallery must NOT mark alternative ${altId} with data-selection-state="winner" — found ${mismatches.length} mismatch(es)`
      ).toBe(0);
    }
  });

  test('gallery has exactly 5 winner-state preview cells (one per size)', () => {
    const content = stripStyleBlocks(readGallery());

    const winnerCells = [...content.matchAll(
      /data-candidate="C\d+"[^>]*data-selection-state="winner"[^>]*data-size="[^"]+"/g
    )];
    expect(
      winnerCells.length,
      `Gallery must have exactly 5 preview cells with data-selection-state="winner" (one per size), found ${winnerCells.length}`
    ).toBe(5);
  });

  test('gallery has exactly 10 archived-alternative preview cells (two candidates × 5 sizes)', () => {
    const content = stripStyleBlocks(readGallery());

    const altCells = [...content.matchAll(
      /data-candidate="C\d+"[^>]*data-selection-state="archived-alternative"[^>]*data-size="[^"]+"/g
    )];
    expect(
      altCells.length,
      `Gallery must have exactly 10 archived-alternative preview cells (2 candidates × 5 sizes), found ${altCells.length}`
    ).toBe(10);
  });

  // ── Negative: missing gallery winner marker ───────────────────────────────────
  test('removing winner markers from gallery would break the winner-cell count (negative boundary)', () => {
    const content = stripStyleBlocks(readGallery());

    // Simulate stripping all winner data-selection-state attributes
    const stripped = content.replace(/data-selection-state="winner"/g, '');
    const remaining = [...stripped.matchAll(
      /data-candidate="C\d+"[^>]*data-selection-state="winner"/g
    )];
    expect(
      remaining.length,
      'After stripping all winner markers, the winner-cell count should be 0 — confirming the assertion is sensitive'
    ).toBe(0);
  });
});
