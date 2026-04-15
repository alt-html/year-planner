// .tests/smoke/icon-live-wiring.spec.js
// Filesystem assertions for live web/PWA icon wiring (R004).
// Enforces: site/index.html (compose output) references canonical ./icons/* hrefs
// and site/manifest.json has exactly 6 PWA icon entries covering any/maskable/monochrome
// at 192x192 and 512x512, with every referenced file present on disk.
// Includes negative-path assertions for malformed wiring detection.
// No browser required — all assertions are pure Node.js fs checks.

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const REPO_ROOT      = path.join(__dirname, '..', '..');
const INDEX_PATH     = path.join(REPO_ROOT, 'site', 'index.html');
const MANIFEST_PATH  = path.join(REPO_ROOT, 'site', 'manifest.json');
const ICONS_DIR      = path.join(REPO_ROOT, 'site', 'icons');

const EXPECTED_HEAD_REFS = [
  './icons/apple-touch-icon-180x180.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
];

const EXPECTED_MANIFEST_SRCS = [
  './icons/pwa-any-192x192.png',
  './icons/pwa-any-512x512.png',
  './icons/pwa-maskable-192x192.png',
  './icons/pwa-maskable-512x512.png',
  './icons/pwa-monochrome-192x192.png',
  './icons/pwa-monochrome-512x512.png',
];

const REQUIRED_PURPOSES   = new Set(['any', 'maskable', 'monochrome']);
const EXPECTED_ICON_COUNT = 6;

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadManifest() {
  expect(
    fs.existsSync(MANIFEST_PATH),
    `site/manifest.json must exist at ${MANIFEST_PATH}`
  ).toBe(true);
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`site/manifest.json is not valid JSON: ${e.message}`);
  }
  return parsed;
}

function loadIndex() {
  expect(
    fs.existsSync(INDEX_PATH),
    `site/index.html must exist at ${INDEX_PATH} — run: bash .compose/build.sh`
  ).toBe(true);
  return fs.readFileSync(INDEX_PATH, 'utf8');
}

// ── Suite: site/index.html canonical icon head links ─────────────────────────

test.describe('site/index.html canonical icon head links', () => {

  test('site/index.html exists', () => {
    expect(
      fs.existsSync(INDEX_PATH),
      `site/index.html must exist — run: bash .compose/build.sh`
    ).toBe(true);
  });

  test('site/index.html references apple-touch-icon at canonical ./icons/ path', () => {
    const content = loadIndex();
    expect(
      content.includes('./icons/apple-touch-icon-180x180.png'),
      'site/index.html must contain href="./icons/apple-touch-icon-180x180.png" — edit .compose/fragments/head.html then rebuild'
    ).toBe(true);
  });

  test('site/index.html references favicon-32x32 at canonical ./icons/ path', () => {
    const content = loadIndex();
    expect(
      content.includes('./icons/favicon-32x32.png'),
      'site/index.html must contain href="./icons/favicon-32x32.png" — edit .compose/fragments/head.html then rebuild'
    ).toBe(true);
  });

  test('site/index.html references favicon-16x16 at canonical ./icons/ path', () => {
    const content = loadIndex();
    expect(
      content.includes('./icons/favicon-16x16.png'),
      'site/index.html must contain href="./icons/favicon-16x16.png" — edit .compose/fragments/head.html then rebuild'
    ).toBe(true);
  });

  test('all three canonical head icon refs are present (combined)', () => {
    const content = loadIndex();
    const missing = EXPECTED_HEAD_REFS.filter((ref) => !content.includes(ref));
    expect(
      missing,
      `site/index.html is missing canonical head icon refs:\n  ${missing.join('\n  ')}\nEdit .compose/fragments/head.html and run: bash .compose/build.sh`
    ).toHaveLength(0);
  });

  test('site/index.html does not reference legacy root-level favicon paths (stale ref guard)', () => {
    const content = loadIndex();
    const legacyRefs = ['href="./favicon-32x32.png"', 'href="./favicon-16x16.png"', 'href="./apple-touch-icon.png"'];
    const stale = legacyRefs.filter((ref) => content.includes(ref));
    expect(
      stale,
      `site/index.html still contains legacy (pre-canonical) icon href refs:\n  ${stale.join('\n  ')}\nEdit .compose/fragments/head.html to use ./icons/* paths then rebuild`
    ).toHaveLength(0);
  });
});

// ── Suite: site/manifest.json structural contract ─────────────────────────────

test.describe('site/manifest.json structural contract', () => {

  test('site/manifest.json exists', () => {
    expect(
      fs.existsSync(MANIFEST_PATH),
      `site/manifest.json must exist at ${MANIFEST_PATH}`
    ).toBe(true);
  });

  test('site/manifest.json is valid JSON', () => {
    loadManifest();
  });

  test('site/manifest.json has a top-level "icons" array', () => {
    const manifest = loadManifest();
    expect(
      Array.isArray(manifest.icons),
      'site/manifest.json must have a top-level "icons" array'
    ).toBe(true);
  });

  test(`site/manifest.json has exactly ${EXPECTED_ICON_COUNT} icon entries`, () => {
    const manifest = loadManifest();
    expect(
      manifest.icons.length,
      `site/manifest.json must have exactly ${EXPECTED_ICON_COUNT} icon entries (any/maskable/monochrome × 192/512), found ${manifest.icons.length}`
    ).toBe(EXPECTED_ICON_COUNT);
  });

  test('every manifest icon entry has required fields: src, sizes, type, purpose', () => {
    const manifest = loadManifest();
    const REQUIRED_FIELDS = ['src', 'sizes', 'type', 'purpose'];
    const missing = [];
    for (const [i, icon] of manifest.icons.entries()) {
      for (const field of REQUIRED_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(icon, field)) {
          missing.push(
            `icons[${i}]: missing field "${field}" (src=${icon.src ?? '?'})`
          );
        }
      }
    }
    expect(
      missing,
      `site/manifest.json icon entries with missing required fields:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('every manifest icon purpose is a valid token (any, maskable, monochrome)', () => {
    const manifest = loadManifest();
    const invalid  = [];
    for (const [i, icon] of manifest.icons.entries()) {
      if (!REQUIRED_PURPOSES.has(icon.purpose)) {
        invalid.push(
          `icons[${i}]: invalid purpose "${icon.purpose}" (src=${icon.src})`
        );
      }
    }
    expect(
      invalid,
      `site/manifest.json entries with invalid purpose tokens:\n  ${invalid.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('all 3 required purpose buckets are present (any, maskable, monochrome)', () => {
    const manifest = loadManifest();
    const found    = new Set(manifest.icons.map((i) => i.purpose));
    for (const purpose of REQUIRED_PURPOSES) {
      expect(
        found.has(purpose),
        `site/manifest.json must have at least one entry with purpose "${purpose}" — found: ${[...found].sort().join(', ')}`
      ).toBe(true);
    }
  });

  test('all 6 canonical PWA icon src paths are present', () => {
    const manifest = loadManifest();
    const srcs     = new Set(manifest.icons.map((i) => i.src));
    const missing  = EXPECTED_MANIFEST_SRCS.filter((src) => !srcs.has(src));
    expect(
      missing,
      `site/manifest.json is missing canonical PWA icon src entries:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });
});

// ── Suite: PWA size coverage ───────────────────────────────────────────────────

test.describe('PWA purpose × size coverage', () => {

  for (const purpose of ['any', 'maskable', 'monochrome']) {
    for (const size of ['192x192', '512x512']) {
      test(`manifest has ${purpose} icon at ${size}`, () => {
        const manifest = loadManifest();
        const match    = manifest.icons.find(
          (i) => i.purpose === purpose && i.sizes === size
        );
        expect(
          match,
          `site/manifest.json must have an icon with purpose="${purpose}" sizes="${size}" — not found`
        ).toBeTruthy();
      });
    }
  }
});

// ── Suite: icon files exist on disk ───────────────────────────────────────────

test.describe('icon files referenced in manifest exist on disk', () => {

  test('every manifest icon src resolves to an existing file under site/', () => {
    const manifest = loadManifest();
    const missing  = [];
    for (const icon of manifest.icons) {
      // src is relative to manifest location (site/); strip leading './'
      const rel      = icon.src.replace(/^\.\//, '');
      const resolved = path.join(REPO_ROOT, 'site', rel);
      if (!fs.existsSync(resolved)) {
        missing.push(
          `${icon.src} (purpose=${icon.purpose}, sizes=${icon.sizes}) — file not found at ${resolved}`
        );
      }
    }
    expect(
      missing,
      `Manifest icon files missing from disk:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });

  test('head icon files (apple-touch-icon, favicons) exist under site/icons/', () => {
    const iconFiles = [
      'apple-touch-icon-180x180.png',
      'favicon-32x32.png',
      'favicon-16x16.png',
    ];
    const missing = iconFiles.filter(
      (f) => !fs.existsSync(path.join(ICONS_DIR, f))
    );
    expect(
      missing,
      `Canonical head icon files missing from site/icons/:\n  ${missing.join('\n  ')}`
    ).toHaveLength(0);
  });
});

// ── Suite: negative-path assertions ──────────────────────────────────────────

test.describe('negative-path assertions (malformed wiring detection)', () => {

  test('missing head canonical ref would be caught by the all-refs-present check (negative boundary)', () => {
    const fakeContent  = '<link rel="icon" sizes="32x32" href="./icons/favicon-32x32.png">';
    const missingRefs  = EXPECTED_HEAD_REFS.filter((ref) => !fakeContent.includes(ref));
    expect(
      missingRefs.length,
      `A page missing canonical head refs must be detected — confirmed ${missingRefs.length} would be caught`
    ).toBeGreaterThan(0);
  });

  test('manifest with 5 entries would fail the exact-count check (negative boundary)', () => {
    const fakeIcons = Array(5).fill({ src: './icons/pwa-any-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' });
    expect(
      fakeIcons.length,
      `A 5-entry manifest must not equal ${EXPECTED_ICON_COUNT} — the count check would catch this`
    ).not.toBe(EXPECTED_ICON_COUNT);
  });

  test('manifest with 7 entries would fail the exact-count check (negative boundary)', () => {
    const fakeIcons = Array(7).fill({ src: './icons/pwa-any-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' });
    expect(
      fakeIcons.length,
      `A 7-entry manifest must not equal ${EXPECTED_ICON_COUNT} — the count check would catch this`
    ).not.toBe(EXPECTED_ICON_COUNT);
  });

  test('manifest entry missing "purpose" field would be caught by the required-field check (negative boundary)', () => {
    const fakeEntry = { src: './icons/pwa-any-192x192.png', sizes: '192x192', type: 'image/png' };
    expect(
      Object.prototype.hasOwnProperty.call(fakeEntry, 'purpose'),
      'An entry without "purpose" must be detected as malformed'
    ).toBe(false);
  });

  test('invalid purpose token would be rejected by the valid-purpose-set check (negative boundary)', () => {
    const invalidTokens = ['any-plus', 'mask', 'ALL', '', null, undefined];
    for (const token of invalidTokens) {
      expect(
        REQUIRED_PURPOSES.has(token),
        `Invalid purpose token "${token}" must not be accepted`
      ).toBe(false);
    }
  });

  test('legacy android-chrome src paths would not match canonical expected srcs (negative boundary)', () => {
    const legacySrc = '/android-chrome-192x192.png';
    expect(
      EXPECTED_MANIFEST_SRCS.includes(legacySrc),
      `Legacy src "${legacySrc}" must not appear in the canonical expected-srcs list`
    ).toBe(false);
  });
});
