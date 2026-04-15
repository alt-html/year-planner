// .tests/smoke/icon-candidates-gallery.spec.js
// HTML integrity assertions for the icon candidate gallery.
// Enforces: gallery HTML exists, exactly 3 candidates × 5 required sizes are referenced,
// no invalid candidate IDs appear, all referenced preview PNGs exist on disk, and
// boundary conditions are met (exactly 15 preview cells).
// No browser required — all assertions are pure Node.js fs + regex checks.

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const GALLERY_HTML   = path.join(__dirname, '..', '..', 'mockups', 'icon-comparison.html');
const MOCKUPS_DIR    = path.join(__dirname, '..', '..', 'mockups');

const REQUIRED_CANDIDATES = ['C1', 'C2', 'C3'];
const REQUIRED_SIZES      = ['16x16', '32x32', '180x180', '192x192', '512x512'];
const VALID_CANDIDATE_IDS = new Set(REQUIRED_CANDIDATES);

// ── Helper: read gallery HTML once per describe block ────────────────────────

function readGallery() {
  expect(
    fs.existsSync(GALLERY_HTML),
    'mockups/icon-comparison.html must exist — this is the gallery deliverable'
  ).toBe(true);
  return fs.readFileSync(GALLERY_HTML, 'utf8');
}

// ── Suite: candidate gallery HTML integrity ──────────────────────────────────

test.describe('candidate gallery HTML integrity', () => {

  test('gallery HTML file exists and has substantial content', () => {
    expect(
      fs.existsSync(GALLERY_HTML),
      'mockups/icon-comparison.html must exist'
    ).toBe(true);
    const content = fs.readFileSync(GALLERY_HTML, 'utf8');
    expect(
      content.length,
      'Gallery HTML is empty or trivially short'
    ).toBeGreaterThan(1000);
  });

  test('gallery references exactly the three required candidate IDs (C1, C2, C3)', () => {
    const content = readGallery();

    // Collect every data-candidate value that looks like a candidate ID
    const found = new Set();
    for (const m of content.matchAll(/data-candidate="(C\d+)"/g)) {
      found.add(m[1]);
    }

    for (const id of REQUIRED_CANDIDATES) {
      expect(
        found.has(id),
        `Gallery must contain data-candidate="${id}"`
      ).toBe(true);
    }
    expect(
      found.size,
      `Gallery must reference exactly 3 candidate IDs (C1, C2, C3), found: ${[...found].sort().join(', ')}`
    ).toBe(3);
  });

  test('gallery contains no invalid candidate IDs (e.g. C4, typo slugs)', () => {
    const content = readGallery();

    const found = new Set();
    for (const m of content.matchAll(/data-candidate="([^"]+)"/g)) {
      found.add(m[1]);
    }

    const invalid = [...found].filter(id => !VALID_CANDIDATE_IDS.has(id));
    expect(
      invalid,
      `Gallery contains invalid data-candidate values: ${invalid.join(', ')} — only C1, C2, C3 are valid`
    ).toHaveLength(0);
  });

  test('gallery contains all 5 required size tokens', () => {
    const content = readGallery();

    for (const size of REQUIRED_SIZES) {
      expect(
        content,
        `Gallery must contain the size token "${size}" (in data-size attribute or visible label)`
      ).toContain(size);
    }
  });

  test('gallery has exactly 15 preview cells with both data-candidate + data-size', () => {
    const content = readGallery();

    // Cells always written as data-candidate="Cn" data-size="…" (same attribute order)
    const cells = [...content.matchAll(/data-candidate="C\d+"[^>]*data-size="[^"]+"/g)];
    expect(
      cells.length,
      `Expected exactly 15 preview cells (3 candidates × 5 sizes), found ${cells.length}. ` +
      `Check that every candidate×size combination has an element with both data-candidate and data-size attributes.`
    ).toBe(15);
  });

  test('each required candidate has exactly 5 size entries', () => {
    const content = readGallery();

    for (const candidateId of REQUIRED_CANDIDATES) {
      // Match cells that have data-candidate="Cn" followed by data-size="…"
      const pattern = new RegExp(`data-candidate="${candidateId}"[^>]*data-size="`, 'g');
      const count = [...content.matchAll(pattern)].length;
      expect(
        count,
        `Candidate ${candidateId} must have exactly 5 size entries, found ${count} ` +
        `(expected one cell per size: ${REQUIRED_SIZES.join(', ')})`
      ).toBe(5);
    }
  });

  test('each required size has exactly 3 candidate entries (one per candidate column)', () => {
    const content = readGallery();

    for (const size of REQUIRED_SIZES) {
      // Only count cells that carry both attributes together
      const pattern = new RegExp(`data-candidate="C\\d+"[^>]*data-size="${size}"`, 'g');
      const count = [...content.matchAll(pattern)].length;
      expect(
        count,
        `Size ${size} must appear in exactly 3 cells (one per candidate C1/C2/C3), found ${count}`
      ).toBe(3);
    }
  });

  test('gallery does not reference a non-existent candidate C4', () => {
    const content = readGallery();
    expect(
      content,
      'Gallery must not contain data-candidate="C4" — only C1, C2, C3 are valid candidates'
    ).not.toContain('data-candidate="C4"');
  });

  test('gallery references exactly 15 unique icon-candidate PNG src paths', () => {
    const content = readGallery();

    const srcs = new Set(
      [...content.matchAll(/src="(icon-candidates\/[^"]+\.png)"/g)].map(m => m[1])
    );

    expect(
      srcs.size,
      `Expected exactly 15 unique icon-candidate PNG references (3 candidates × 5 sizes), ` +
      `found ${srcs.size}: ${[...srcs].sort().join(', ')}`
    ).toBe(15);
  });

  test('all referenced icon-candidate PNG files exist on disk', () => {
    const content = readGallery();

    const srcs = new Set(
      [...content.matchAll(/src="(icon-candidates\/[^"]+\.png)"/g)].map(m => m[1])
    );

    const missing = [];
    for (const src of srcs) {
      const resolved = path.resolve(MOCKUPS_DIR, src);
      if (!fs.existsSync(resolved)) {
        missing.push(src);
      }
    }

    expect(
      missing,
      `Gallery references missing preview files:\n  ${missing.join('\n  ')}\n` +
      `  Re-export all previews with: bash scripts/export-icon-candidates.sh`
    ).toHaveLength(0);
  });

  // ── Negative: verifies the test suite itself is sensitive to missing files ──
  // (This is a boundary check, not an actual file-deletion test — we validate
  //  that the count invariant is tight enough to catch any omission.)
  test('removing one expected size from gallery would reduce preview-cell count below 15', () => {
    const content = readGallery();

    // Simulate removing all 512x512 references: count remaining
    const stripped = content.replace(/data-size="512x512"/g, '');
    const remaining = [...stripped.matchAll(/data-candidate="C\d+"[^>]*data-size="[^"]+"/g)].length;

    // The real gallery has 15 cells; stripping 3 (one per candidate) leaves 12
    expect(
      remaining,
      'Stripping 512x512 size entries from the gallery should leave exactly 12 preview cells'
    ).toBe(12);
  });

  test('adding a bogus C4 entry would violate the candidate-count assertion', () => {
    // This test verifies the detection logic itself is sensitive
    const content = readGallery();
    const injected = content + '<div data-candidate="C4" data-size="16x16"></div>';

    const found = new Set();
    for (const m of injected.matchAll(/data-candidate="(C\d+)"/g)) {
      found.add(m[1]);
    }

    // Should now find 4 candidates — confirming the assertion at count===3 would catch this
    expect(
      found.has('C4'),
      'Injected C4 should be detectable by the candidate-set scan'
    ).toBe(true);
    expect(
      found.size,
      'Injected C4 should push candidate count to 4, confirming the count===3 guard works'
    ).toBe(4);
  });
});
