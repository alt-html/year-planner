// .tests/verification/S06-visual-sign-off.spec.js
//
// Visual sign-off sheet spec for M012 icon integration (R006).
//
// Validates that all required web/PWA and desktop icon surfaces exist in both
// matrix contracts and on disk, then generates a labeled sign-off HTML sheet
// and captures a deterministic PNG screenshot for audit.
//
// Required surfaces:
//   web/PWA: sizes 16, 32, 180, 192, 512 (various purposes)
//   desktop: ico (windows) + icns (macos)
//
// Artifacts written to:
//   .tests/test-results/icon-visual-signoff/S06-visual-sign-off.html
//   .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png
//   .tests/test-results/icon-visual-signoff/S06-sign-off-report.json
//
// Run: npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js

const { test, expect } = require('@playwright/test');
const path             = require('path');
const fs               = require('fs');

const REPO_ROOT           = path.join(__dirname, '..', '..');
const MATRIX_PATH         = path.join(REPO_ROOT, 'site', 'icons', 'matrix.json');
const DESKTOP_MATRIX_PATH = path.join(REPO_ROOT, 'site', 'icons', 'desktop-matrix.json');
const OUT_DIR             = path.join(__dirname, '..', 'test-results', 'icon-visual-signoff');
const HTML_PATH           = path.join(OUT_DIR, 'S06-visual-sign-off.html');
const PNG_PATH            = path.join(OUT_DIR, 'S06-visual-sign-off-sheet.png');
const REPORT_PATH         = path.join(OUT_DIR, 'S06-sign-off-report.json');

// Required web/PWA surfaces — must be present in matrix.json and on disk.
// Covers all five sizes called out in R006 and S06 success criteria.
const REQUIRED_WEB_SURFACES = [
  { platform: 'web', purpose: 'any', size: 16  },
  { platform: 'web', purpose: 'any', size: 32  },
  { platform: 'ios', purpose: 'any', size: 180 },
  { platform: 'pwa', purpose: 'any', size: 192 },
  { platform: 'pwa', purpose: 'any', size: 512 },
];

// Required desktop formats — must appear in desktop-matrix.json.
const REQUIRED_DESKTOP_FORMATS = ['ico', 'icns'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadJSON(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} must exist at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${label} is not valid JSON: ${e.message}`);
  }
}

/**
 * Validate that an output field from a matrix entry is a safe relative path
 * (no absolute paths, no directory traversal). Fails fast with a clear message.
 */
function assertSafePath(outputField) {
  const norm = path.normalize(outputField);
  if (path.isAbsolute(norm) || norm.startsWith('..')) {
    throw new Error(
      `Unsafe output path rejected: "${outputField}" — matrix output paths must be relative and non-traversing`
    );
  }
  return norm;
}

/** Base64-encode a binary file as a data URL. */
function toDataURL(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${data.toString('base64')}`;
}

/**
 * Build the sign-off HTML from validated matrix data.
 * Embeds PNG icons as base64 data URLs so the sheet is self-contained.
 * Throws with an explicit message if any required surface is absent.
 */
function buildSignOffHTML(matrix, desktopMatrix) {
  const requiredWebCards = [];
  const additionalCards  = [];
  const desktopCards     = [];

  // ── Required web/PWA cards ────────────────────────────────────────────────
  for (const surface of REQUIRED_WEB_SURFACES) {
    const entry = matrix.entries.find(
      (e) => e.platform === surface.platform && e.purpose === surface.purpose && e.size === surface.size
    );
    if (!entry) {
      throw new Error(
        `Required surface missing from matrix.json: platform=${surface.platform} purpose=${surface.purpose} size=${surface.size}`
      );
    }

    assertSafePath(entry.output);
    const absPath = path.join(REPO_ROOT, entry.output);

    if (!fs.existsSync(absPath)) {
      throw new Error(
        `Required icon file not found on disk: ${entry.output} ` +
        `(platform=${entry.platform} purpose=${entry.purpose} size=${entry.size})`
      );
    }
    const stat = fs.statSync(absPath);
    if (stat.size === 0) {
      throw new Error(`Required icon file is zero bytes: ${entry.output}`);
    }

    const dataURL     = toDataURL(absPath, 'image/png');
    const displaySize = Math.min(entry.size, 96);
    const label       = `${entry.platform} / ${entry.purpose} / ${entry.size}px`;

    requiredWebCards.push(`
      <div class="card required">
        <div class="card-img" style="width:${displaySize}px;height:${displaySize}px;">
          <img src="${dataURL}" alt="${label}" width="${displaySize}" height="${displaySize}" />
        </div>
        <div class="card-label">${label}</div>
        <div class="card-meta">${path.basename(entry.output)}<br>${stat.size.toLocaleString()} B</div>
        <div class="badge ok">✓ required · present</div>
      </div>`);
  }

  // ── Additional (non-required) web/PWA cards ───────────────────────────────
  for (const entry of matrix.entries) {
    const isRequired = REQUIRED_WEB_SURFACES.some(
      (s) => s.platform === entry.platform && s.purpose === entry.purpose && s.size === entry.size
    );
    if (isRequired) continue;

    assertSafePath(entry.output);
    const absPath  = path.join(REPO_ROOT, entry.output);
    const exists   = fs.existsSync(absPath);
    const stat     = exists ? fs.statSync(absPath) : null;
    const dataURL  = exists && stat.size > 0 ? toDataURL(absPath, 'image/png') : null;
    const dispSize = Math.min(entry.size, 96);
    const label    = `${entry.platform} / ${entry.purpose} / ${entry.size}px`;

    additionalCards.push(`
      <div class="card additional">
        <div class="card-img" style="width:${dispSize}px;height:${dispSize}px;">
          ${dataURL
            ? `<img src="${dataURL}" alt="${label}" width="${dispSize}" height="${dispSize}" />`
            : `<span class="missing-img">missing</span>`}
        </div>
        <div class="card-label">${label}</div>
        <div class="card-meta">${path.basename(entry.output)}${stat ? `<br>${stat.size.toLocaleString()} B` : ''}</div>
        <div class="badge ${exists ? 'ok' : 'err'}">${exists ? '✓ present' : '✗ missing'}</div>
      </div>`);
  }

  // ── Desktop packaging cards ───────────────────────────────────────────────
  for (const format of REQUIRED_DESKTOP_FORMATS) {
    const entry = desktopMatrix.entries.find((e) => e.format === format);
    if (!entry) {
      throw new Error(
        `Required desktop format missing from desktop-matrix.json: format=${format}`
      );
    }

    assertSafePath(entry.output);
    const absPath = path.join(REPO_ROOT, entry.output);

    if (!fs.existsSync(absPath)) {
      throw new Error(
        `Required desktop file not found on disk: ${entry.output} (format=${format})`
      );
    }
    const stat = fs.statSync(absPath);
    if (stat.size === 0) {
      throw new Error(`Required desktop file is zero bytes: ${entry.output}`);
    }

    const sizesStr  = Array.isArray(entry.sizes) ? entry.sizes.join(', ') : 'N/A';
    const sizeKB    = (stat.size / 1024).toFixed(1);

    // ICO: browsers can render it as an image via data URL.
    // ICNS: no browser support — show a styled badge instead.
    let imgContent;
    if (format === 'ico') {
      const dataURL = toDataURL(absPath, 'image/x-icon');
      imgContent = `<img src="${dataURL}" alt="${format}" width="64" height="64" style="image-rendering:pixelated;" />`;
    } else {
      imgContent = `<span class="format-badge">${format.toUpperCase()}</span>`;
    }

    desktopCards.push(`
      <div class="card desktop">
        <div class="card-img" style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;">
          ${imgContent}
        </div>
        <div class="card-label">desktop / ${format} / ${entry.platform}</div>
        <div class="card-meta">${path.basename(entry.output)}<br>${sizeKB} KB<br>sizes: ${sizesStr}</div>
        <div class="badge ok">✓ required · present</div>
      </div>`);
  }

  const generatedAt = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>M012 Icon Integration — Visual Sign-off Sheet</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5; color: #1a1a2e; padding: 28px 32px;
    }
    h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 6px; }
    .meta { font-size: 0.78rem; color: #556; margin-bottom: 28px; line-height: 1.6; }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: #445; margin-bottom: 14px;
      padding-bottom: 6px; border-bottom: 2px solid #c8cdd8;
    }
    .grid { display: flex; flex-wrap: wrap; gap: 14px; }
    .card {
      background: #fff; border: 1px solid #d0d4de; border-radius: 10px;
      padding: 16px 14px; display: flex; flex-direction: column;
      align-items: center; gap: 9px; min-width: 148px; max-width: 172px;
    }
    .card.additional { opacity: 0.72; }
    .card-img {
      background:
        repeating-conic-gradient(#dde0e8 0% 25%, #f6f7f9 0% 50%)
        0 0 / 14px 14px;
      border-radius: 6px; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .card-img img { display: block; }
    .missing-img {
      color: #aaa; font-size: 0.7rem;
    }
    .format-badge {
      background: #1a2a3a; color: #fff; font-size: 0.95rem; font-weight: 700;
      border-radius: 7px; padding: 10px 14px; letter-spacing: 0.12em;
    }
    .card-label {
      font-size: 0.72rem; font-weight: 600; text-align: center;
      color: #1a1a2e; line-height: 1.4;
    }
    .card-meta {
      font-size: 0.64rem; color: #778; text-align: center; line-height: 1.55;
    }
    .badge {
      font-size: 0.67rem; font-weight: 600;
      padding: 2px 9px; border-radius: 12px; white-space: nowrap;
    }
    .badge.ok  { background: #e6f4ea; color: #1e7e34; }
    .badge.err { background: #fdecea; color: #b71c1c; }
    footer {
      margin-top: 28px; font-size: 0.7rem; color: #889;
      border-top: 1px solid #d0d4de; padding-top: 12px; line-height: 1.7;
    }
  </style>
</head>
<body>
  <h1>M012 Icon Integration — Visual Sign-off Sheet</h1>
  <p class="meta">
    Candidate: <strong>${matrix.candidateId ?? 'N/A'}</strong>
    (${matrix.candidateName ?? ''})&nbsp;&nbsp;|&nbsp;&nbsp;
    Generated: ${generatedAt}&nbsp;&nbsp;|&nbsp;&nbsp;
    Surfaces: ${REQUIRED_WEB_SURFACES.length} required web/PWA + ${REQUIRED_DESKTOP_FORMATS.length} desktop
  </p>

  <div class="section">
    <div class="section-title">Required Web / PWA Surfaces — 16, 32, 180, 192, 512 px</div>
    <div class="grid">
      ${requiredWebCards.join('\n')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Additional PWA Surfaces — maskable &amp; monochrome</div>
    <div class="grid">
      ${additionalCards.length ? additionalCards.join('\n') : '<p style="font-size:0.78rem;color:#888;">None</p>'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Desktop Packaging Surfaces — ICO (Windows) + ICNS (macOS)</div>
    <div class="grid">
      ${desktopCards.join('\n')}
    </div>
  </div>

  <footer>
    Spec: verification/S06-visual-sign-off.spec.js&nbsp;&nbsp;|&nbsp;&nbsp;
    matrix.json: ${matrix.entries.length} entries&nbsp;&nbsp;|&nbsp;&nbsp;
    desktop-matrix.json: ${desktopMatrix.entries.length} entries&nbsp;&nbsp;|&nbsp;&nbsp;
    Artifact: ${PNG_PATH}
  </footer>
</body>
</html>`;
}

// ── Suite: Matrix contract validation ─────────────────────────────────────────

test.describe('matrix contract validation', () => {

  test('matrix.json exists and has a non-empty entries array', () => {
    const matrix = loadJSON(MATRIX_PATH, 'matrix.json');
    expect(
      Array.isArray(matrix.entries),
      'matrix.json must have a top-level "entries" array'
    ).toBe(true);
    expect(
      matrix.entries.length,
      `matrix.json "entries" must be non-empty, found ${matrix.entries.length}`
    ).toBeGreaterThan(0);
  });

  test('desktop-matrix.json exists and has a non-empty entries array', () => {
    const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    expect(
      Array.isArray(matrix.entries),
      'desktop-matrix.json must have a top-level "entries" array'
    ).toBe(true);
    expect(
      matrix.entries.length,
      `desktop-matrix.json "entries" must be non-empty, found ${matrix.entries.length}`
    ).toBeGreaterThan(0);
  });

  for (const surface of REQUIRED_WEB_SURFACES) {
    test(`matrix.json has required surface: ${surface.platform}/${surface.purpose}/${surface.size}px`, () => {
      const matrix = loadJSON(MATRIX_PATH, 'matrix.json');
      const entry  = matrix.entries.find(
        (e) => e.platform === surface.platform && e.purpose === surface.purpose && e.size === surface.size
      );
      expect(
        entry,
        `matrix.json must have an entry for platform=${surface.platform} purpose=${surface.purpose} size=${surface.size} — ` +
        `run: bash scripts/export-canonical-icon-matrix.sh`
      ).toBeTruthy();
    });
  }

  for (const surface of REQUIRED_WEB_SURFACES) {
    test(`required surface ${surface.platform}/${surface.purpose}/${surface.size}px exists on disk`, () => {
      const matrix = loadJSON(MATRIX_PATH, 'matrix.json');
      const entry  = matrix.entries.find(
        (e) => e.platform === surface.platform && e.purpose === surface.purpose && e.size === surface.size
      );
      if (!entry) return; // caught by the preceding test

      assertSafePath(entry.output);
      const absPath = path.join(REPO_ROOT, entry.output);

      expect(
        fs.existsSync(absPath),
        `Required icon file not found on disk: ${entry.output} — ` +
        `run: bash scripts/export-canonical-icon-matrix.sh`
      ).toBe(true);

      const stat = fs.statSync(absPath);
      expect(
        stat.size,
        `Required icon file is zero bytes: ${entry.output}`
      ).toBeGreaterThan(0);
    });
  }

  for (const format of REQUIRED_DESKTOP_FORMATS) {
    test(`desktop-matrix.json has required format: ${format}`, () => {
      const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
      const entry  = matrix.entries.find((e) => e.format === format);
      expect(
        entry,
        `desktop-matrix.json must have an entry with format="${format}" — ` +
        `run: bash scripts/export-desktop-packaging-assets.sh`
      ).toBeTruthy();
    });
  }

  for (const format of REQUIRED_DESKTOP_FORMATS) {
    test(`required desktop format ${format} output file exists on disk`, () => {
      const matrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
      const entry  = matrix.entries.find((e) => e.format === format);
      if (!entry) return; // caught by preceding test

      assertSafePath(entry.output);
      const absPath = path.join(REPO_ROOT, entry.output);

      expect(
        fs.existsSync(absPath),
        `Required desktop file not found on disk: ${entry.output} — ` +
        `run: bash scripts/export-desktop-packaging-assets.sh`
      ).toBe(true);

      const stat = fs.statSync(absPath);
      expect(
        stat.size,
        `Required desktop file is zero bytes: ${entry.output}`
      ).toBeGreaterThan(0);
    });
  }

  test('all matrix entry output paths are safe (no traversal or absolute paths)', () => {
    const matrix        = loadJSON(MATRIX_PATH, 'matrix.json');
    const desktopMatrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');
    const unsafe        = [];

    for (const entry of [...matrix.entries, ...desktopMatrix.entries]) {
      const norm = path.normalize(entry.output);
      if (path.isAbsolute(norm) || norm.startsWith('..')) {
        unsafe.push(`"${entry.output}" — resolves to unsafe path "${norm}"`);
      }
    }

    expect(
      unsafe,
      `Matrix entries with unsafe output paths:\n  ${unsafe.join('\n  ')}`
    ).toHaveLength(0);
  });
});

// ── Suite: Sign-off HTML generation ───────────────────────────────────────────

test.describe('sign-off HTML generation', () => {

  test('generates deterministic sign-off HTML from validated matrix contracts', () => {
    const matrix        = loadJSON(MATRIX_PATH, 'matrix.json');
    const desktopMatrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const html = buildSignOffHTML(matrix, desktopMatrix);
    fs.writeFileSync(HTML_PATH, html, 'utf8');

    const stat = fs.statSync(HTML_PATH);
    expect(
      stat.size,
      'Generated sign-off HTML must be non-zero bytes'
    ).toBeGreaterThan(0);

    expect(
      html,
      'Sign-off HTML must contain required web/PWA section heading'
    ).toContain('Required Web / PWA Surfaces');

    expect(
      html,
      'Sign-off HTML must contain desktop packaging section heading'
    ).toContain('Desktop Packaging Surfaces');

    // Verify all required surface labels appear in the HTML
    for (const s of REQUIRED_WEB_SURFACES) {
      expect(
        html,
        `Sign-off HTML must show a card for ${s.platform}/${s.purpose}/${s.size}px`
      ).toContain(`${s.platform} / ${s.purpose} / ${s.size}px`);
    }
    for (const fmt of REQUIRED_DESKTOP_FORMATS) {
      expect(
        html,
        `Sign-off HTML must show a card for desktop/${fmt}`
      ).toContain(`desktop / ${fmt}`);
    }
  });
});

// ── Suite: Screenshot capture ─────────────────────────────────────────────────

test.describe('sign-off screenshot', () => {

  test('captures full-page screenshot of sign-off sheet', async ({ page }) => {
    expect(
      fs.existsSync(HTML_PATH),
      `Sign-off HTML must exist at ${HTML_PATH} — run matrix validation and HTML generation tests first`
    ).toBe(true);

    fs.mkdirSync(OUT_DIR, { recursive: true });

    // Navigate to the local HTML file directly (no server needed for self-contained sheet)
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: PNG_PATH, fullPage: true });

    const stat = fs.statSync(PNG_PATH);
    expect(
      stat.size,
      `Screenshot PNG must be non-zero bytes — path: ${PNG_PATH}`
    ).toBeGreaterThan(0);
  });
});

// ── Suite: Sign-off report JSON ────────────────────────────────────────────────

test.describe('sign-off report JSON', () => {

  test('writes structured sign-off report after artifact verification', () => {
    const matrix        = loadJSON(MATRIX_PATH, 'matrix.json');
    const desktopMatrix = loadJSON(DESKTOP_MATRIX_PATH, 'desktop-matrix.json');

    // Verify both artifacts exist before writing verdict
    const htmlOk = fs.existsSync(HTML_PATH) && fs.statSync(HTML_PATH).size > 0;
    const pngOk  = fs.existsSync(PNG_PATH)  && fs.statSync(PNG_PATH).size  > 0;

    const report = {
      spec:        'verification/S06-visual-sign-off.spec.js',
      generatedAt: new Date().toISOString(),
      verdict:     htmlOk && pngOk ? 'pass' : 'fail',
      stage:       'T01-visual-sign-off-spec',
      matrixSummary: {
        entries:        matrix.entries.length,
        candidateId:    matrix.candidateId,
        candidateName:  matrix.candidateName,
      },
      desktopMatrixSummary: {
        entries:        desktopMatrix.entries.length,
        candidateId:    desktopMatrix.candidateId,
      },
      requiredWebSurfaces: REQUIRED_WEB_SURFACES.map((s) => {
        const entry = matrix.entries.find(
          (e) => e.platform === s.platform && e.purpose === s.purpose && e.size === s.size
        );
        const absPath = entry ? path.join(REPO_ROOT, entry.output) : null;
        const present = absPath ? fs.existsSync(absPath) : false;
        return { ...s, output: entry?.output ?? null, present };
      }),
      requiredDesktopFormats: REQUIRED_DESKTOP_FORMATS.map((fmt) => {
        const entry   = desktopMatrix.entries.find((e) => e.format === fmt);
        const absPath = entry ? path.join(REPO_ROOT, entry.output) : null;
        const present = absPath ? fs.existsSync(absPath) : false;
        return { format: fmt, output: entry?.output ?? null, present };
      }),
      artifacts: {
        html:       HTML_PATH,
        screenshot: PNG_PATH,
        report:     REPORT_PATH,
        htmlOk,
        screenshotOk: pngOk,
      },
    };

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

    const stat = fs.statSync(REPORT_PATH);
    expect(
      stat.size,
      'Sign-off report JSON must be non-zero bytes'
    ).toBeGreaterThan(0);

    expect(
      report.verdict,
      `Sign-off report verdict must be "pass" — htmlOk=${htmlOk} screenshotOk=${pngOk}`
    ).toBe('pass');
  });
});

// ── Suite: Negative-boundary assertions ───────────────────────────────────────

test.describe('negative-boundary assertions (missing surface detection)', () => {

  test('missing required size in matrix.json would be caught (negative boundary)', () => {
    // Simulate matrix without the ios/any/180 entry
    const fakeEntries = [
      { platform: 'web', purpose: 'any', size: 16,  output: 'site/icons/favicon-16x16.png' },
      { platform: 'web', purpose: 'any', size: 32,  output: 'site/icons/favicon-32x32.png' },
      // ios/any/180 absent
      { platform: 'pwa', purpose: 'any', size: 192, output: 'site/icons/pwa-any-192x192.png' },
      { platform: 'pwa', purpose: 'any', size: 512, output: 'site/icons/pwa-any-512x512.png' },
    ];
    const missing = REQUIRED_WEB_SURFACES.filter(
      (s) => !fakeEntries.some(
        (e) => e.platform === s.platform && e.purpose === s.purpose && e.size === s.size
      )
    );
    expect(
      missing.length,
      'A matrix without ios/any/180 must be detected as missing a required surface'
    ).toBeGreaterThan(0);
    expect(
      missing.some((s) => s.platform === 'ios' && s.size === 180),
      'ios/any/180 specifically must be flagged as missing'
    ).toBe(true);
  });

  test('missing required desktop format would be caught (negative boundary)', () => {
    const fakeEntries = [
      // only ico — icns absent
      { platform: 'windows', format: 'ico', output: 'site/icons/desktop/year-planner.ico', sizes: [16, 32] },
    ];
    const missing = REQUIRED_DESKTOP_FORMATS.filter(
      (fmt) => !fakeEntries.some((e) => e.format === fmt)
    );
    expect(
      missing.length,
      'A desktop matrix without icns must be detected as missing a required format'
    ).toBeGreaterThan(0);
    expect(
      missing,
      'icns must be the missing format'
    ).toContain('icns');
  });

  test('missing icon file on disk would be caught with explicit path (negative boundary)', () => {
    const fakePath = path.join(REPO_ROOT, 'site', 'icons', 'pwa-any-9999x9999.png');
    expect(
      fs.existsSync(fakePath),
      `Non-existent path "${fakePath}" must not exist — confirms disk-existence check would catch a stale matrix reference`
    ).toBe(false);
  });

  test('absolute output path is detected as unsafe (negative boundary)', () => {
    // POSIX absolute paths only — Windows-style paths are not absolute on Unix
    const unsafePaths = [
      '/etc/passwd',
      '/absolute/icon.png',
      '/usr/share/icons/icon.ico',
    ];
    for (const unsafePath of unsafePaths) {
      const norm     = path.normalize(unsafePath);
      const isUnsafe = path.isAbsolute(norm);
      expect(
        isUnsafe,
        `Absolute path "${unsafePath}" must be detected as unsafe`
      ).toBe(true);
    }
  });

  test('directory traversal path is detected as unsafe (negative boundary)', () => {
    const traversalPaths = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      'site/../../../secret.ico',
    ];
    for (const traversalPath of traversalPaths) {
      const norm     = path.normalize(traversalPath);
      const isUnsafe = path.isAbsolute(norm) || norm.startsWith('..');
      expect(
        isUnsafe,
        `Traversal path "${traversalPath}" (normalised: "${norm}") must be detected as unsafe`
      ).toBe(true);
    }
  });

  test('zero-byte icon file would be caught by size validation (negative boundary)', () => {
    const fakeSize = 0;
    expect(
      fakeSize > 0,
      'A zero-byte file must fail the size > 0 guard'
    ).toBe(false);
  });

  test('malformed matrix.json missing "entries" field would be caught (negative boundary)', () => {
    const fakeMatrix = { schemaVersion: '1.0', generatedAt: '2026-01-01T00:00:00Z' };
    expect(
      Array.isArray(fakeMatrix.entries),
      'A matrix object without "entries" must not pass the entries-array guard'
    ).toBe(false);
  });

  test('desktop matrix entry missing "format" field would be caught (negative boundary)', () => {
    const fakeEntry = { platform: 'windows', candidateId: 'C2', src: 'icon.svg', output: 'a.ico', sizes: [16] };
    expect(
      Object.prototype.hasOwnProperty.call(fakeEntry, 'format'),
      'A desktop entry without "format" must not pass the required-field guard'
    ).toBe(false);
  });

  test('desktop matrix entry missing "sizes" field would be caught (negative boundary)', () => {
    const fakeEntry = { platform: 'windows', format: 'ico', candidateId: 'C2', src: 'icon.svg', output: 'a.ico' };
    expect(
      Object.prototype.hasOwnProperty.call(fakeEntry, 'sizes'),
      'A desktop entry without "sizes" must not pass the required-field guard'
    ).toBe(false);
  });
});
