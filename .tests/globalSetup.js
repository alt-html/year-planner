// .tests/globalSetup.js
const { chromium } = require('@playwright/test');
const { registerCdnRoutes } = require('./fixtures/cdn-routes.js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const JSMDMA_PATH = process.env.JSMDMA_PATH || '/Users/craig/src/github/alt-javascript/jsmdma';
const JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-jwt-secret-32-chars-minimum!!';
const SERVER_PORT = 8081;

module.exports = async function globalSetup(config) {
  // ── Optional: start run-local.js server for contract tests ──────────────────
  const serverScript = path.join(JSMDMA_PATH, 'packages/example-auth/run-local.js');

  if (fs.existsSync(serverScript)) {
    const server = spawn('node', [serverScript], {
      cwd: path.dirname(serverScript),
      env: {
        ...process.env,
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-secret',
        JWT_SECRET: JWT_SECRET,
        SPA_ORIGIN: 'http://localhost:8080',
      },
      stdio: 'pipe',
    });

    server.stderr.on('data', (data) => {
      // Only log errors to reduce noise
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        process.stderr.write(`[run-local.js] ${msg}`);
      }
    });

    // Store PID for teardown
    fs.writeFileSync(path.join(__dirname, '.server-pid'), String(server.pid));

    // Wait for server to be ready (poll /health)
    await new Promise((resolve, reject) => {
      const maxAttempts = 30;
      let attempts = 0;
      let resolved = false;

      const check = () => {
        if (resolved) return;
        attempts++;
        const req = http.get(`http://localhost:${SERVER_PORT}/health`, (res) => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        });
        req.on('error', () => {
          if (attempts >= maxAttempts) {
            if (!resolved) {
              resolved = true;
              reject(new Error('run-local.js failed to start within 15s'));
            }
          } else {
            setTimeout(check, 500);
          }
        });
        req.end();
      };

      // If server exits early, try to resolve anyway (might already be ready)
      server.on('exit', (code) => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`run-local.js exited early with code ${code}`));
        }
      });

      setTimeout(check, 1000); // Give it a moment to start
    }).catch((err) => {
      // Non-fatal — contract tests will skip via live port check
      console.log(`[globalSetup] run-local.js startup: ${err.message} — contract tests will skip`);
    });

    if (fs.existsSync(path.join(__dirname, '.server-pid'))) {
      console.log(`[globalSetup] run-local.js started on port ${SERVER_PORT} (PID: ${server.pid})`);
    }
  } else {
    console.log(`[globalSetup] JSMDMA_PATH not found at ${serverScript} — contract tests will be skipped`);
  }

  // ── Browser launch for shared storage state ──────────────────────────────────
  const authDir = path.join(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Register CDN intercepts — same fixtures as per-test cdn.js.
  // Also strips integrity attributes from index.html so local fixture files
  // pass SRI checks in this raw browser context.
  await registerCdnRoutes(page);

  await page.goto('http://localhost:8080');
  // Wait for CDI initialisation — requires data-app-ready from main.js
  await page.waitForSelector('[data-app-ready]', { timeout: 30000 });

  // App auto-initialises on first visit — M009 schema uses 'dev' key
  // (pre-M009 used '0' — kept as fallback for any legacy path)
  await page.waitForFunction(() =>
    localStorage.getItem('dev') !== null || localStorage.getItem('0') !== null
  );

  // Save full browser state: localStorage
  await context.storageState({
    path: path.join(authDir, 'consent.json'),
  });

  await browser.close();
};
