// CONTRACT-SYNC: Integration tests against real run-local.js backend
// These tests are SKIPPED if run-local.js is not running (JSMDMA_PATH not set).
// Per D-01: test against real server. Per D-03: JWT bypass with known secret.
//
// Protocol notes (from AppSyncController.js + SyncService.js inspection):
//   POST /:application/sync  (e.g. /year-planner/sync)
//   Request body: { collection: string, clientClock: string, changes: Array }
//   Changes shape: { key: string, doc: object, fieldRevs: object, baseClock: string }
//   Response: { serverClock: string, serverChanges: Array, conflicts: Array }
//   serverChanges items: { _key, _rev, _fieldRevs, ...docFields }

const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const http = require('http');

const SERVER_PORT = 8081;
const JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-jwt-secret-32-chars-minimum!!';
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const HLC_ZERO = '0000000000000-000000-00000000';

// Live port check — resilient to stale .server-pid from crashed runs
function checkServerLive() {
    return new Promise((resolve) => {
        const req = http.get(`${SERVER_URL}/health`, { timeout: 2000 }, (res) => {
            resolve(true);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

let serverRunning = false;

test.beforeAll(async () => {
    serverRunning = await checkServerLive();
    if (!serverRunning) {
        console.log('[contract-sync] Server not available — all tests will be skipped');
    }
});

function makeSignedJwt(sub) {
    function b64u(obj) {
        return Buffer.from(JSON.stringify(obj)).toString('base64url');
    }
    const now = Math.floor(Date.now() / 1000);
    const header  = b64u({ alg: 'HS256', typ: 'JWT' });
    const payload = b64u({ sub, iat: now, iat_session: now });
    const sig = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
    return `${header}.${payload}.${sig}`;
}

function httpPost(url, body, headers) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const bodyStr = JSON.stringify(body);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                ...headers,
            },
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, headers: res.headers, body: data });
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

test.describe('Contract: jsmdma sync protocol', () => {
    test.beforeEach(({ }, testInfo) => {
        if (!serverRunning) testInfo.skip();
    });

    test('signed JWT is accepted by server (CONTRACT-SYNC-01)', async () => {
        const jwt = makeSignedJwt('test-user-001');
        const res = await httpPost(`${SERVER_URL}/year-planner/sync`, {
            collection: 'planners',
            clientClock: HLC_ZERO,
            changes: [],
        }, {
            Authorization: `Bearer ${jwt}`,
        });
        // Server should accept the JWT and return 200 with sync response
        expect(res.status).toBe(200);
        const body = JSON.parse(res.body);
        expect(body).toHaveProperty('serverClock');
    });

    test('sync round-trip: send change, receive it back (CONTRACT-SYNC-02)', async () => {
        const jwt = makeSignedJwt('test-user-002');
        const plannerKey = 'test-planner-' + Date.now();
        const plannerDoc = {
            meta: { name: 'Test Planner', year: 2026, userKey: 'test-user-002' },
            days: { '2026-01-01': { tp: 1, tl: 'New Year', col: 2, notes: '', emoji: '' } },
        };

        // Send a change (first sync — empty baseClock)
        const res1 = await httpPost(`${SERVER_URL}/year-planner/sync`, {
            collection: 'planners',
            clientClock: HLC_ZERO,
            changes: [
                {
                    key: plannerKey,
                    doc: plannerDoc,
                    fieldRevs: {},
                    baseClock: HLC_ZERO,
                },
            ],
        }, {
            Authorization: `Bearer ${jwt}`,
        });
        expect(res1.status).toBe(200);
        const body1 = JSON.parse(res1.body);
        expect(body1.serverClock).toBeTruthy();

        // Sync again with the returned serverClock — should get no new changes
        const res2 = await httpPost(`${SERVER_URL}/year-planner/sync`, {
            collection: 'planners',
            clientClock: body1.serverClock,
            changes: [],
        }, {
            Authorization: `Bearer ${jwt}`,
        });
        expect(res2.status).toBe(200);
        const body2 = JSON.parse(res2.body);
        // No new server changes expected (same client, no other writers)
        expect(body2.serverChanges || []).toHaveLength(0);
    });

    test('unsigned/fake JWT is rejected with 401 (CONTRACT-SYNC-03)', async () => {
        // Use the old makeFakeJwt pattern — should be rejected by real server
        const fakeJwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlLXVzZXIifQ.fakesig';
        const res = await httpPost(`${SERVER_URL}/year-planner/sync`, {
            collection: 'planners',
            clientClock: HLC_ZERO,
            changes: [],
        }, {
            Authorization: `Bearer ${fakeJwt}`,
        });
        expect(res.status).toBe(401);
    });

    test('multi-device sync: changes from device A visible to device B (CONTRACT-SYNC-04)', async () => {
        const jwt = makeSignedJwt('test-user-003');
        const plannerKey = 'multi-device-' + Date.now();

        // Device A sends a change
        const plannerDocA = {
            meta: { name: 'Shared Planner', year: 2026, userKey: 'test-user-003' },
            days: { '2026-03-15': { tp: 0, tl: 'from device A', col: 1, notes: '', emoji: '' } },
        };
        const resA = await httpPost(`${SERVER_URL}/year-planner/sync`, {
            collection: 'planners',
            clientClock: HLC_ZERO,
            changes: [
                {
                    key: plannerKey,
                    doc: plannerDocA,
                    fieldRevs: {},
                    baseClock: HLC_ZERO,
                },
            ],
        }, {
            Authorization: `Bearer ${jwt}`,
        });
        expect(resA.status).toBe(200);
        const bodyA = JSON.parse(resA.body);
        expect(bodyA.serverClock).toBeTruthy();

        // Device B syncs (fresh clientClock = HLC_ZERO) — should see device A's change
        const resB = await httpPost(`${SERVER_URL}/year-planner/sync`, {
            collection: 'planners',
            clientClock: HLC_ZERO,
            changes: [],
        }, {
            Authorization: `Bearer ${jwt}`,
        });
        expect(resB.status).toBe(200);
        const bodyB = JSON.parse(resB.body);
        expect(bodyB.serverChanges).toBeDefined();
        expect(bodyB.serverChanges.length).toBeGreaterThan(0);
        // Find the change from device A by key
        const deviceAChange = bodyB.serverChanges.find(c => c._key === plannerKey);
        expect(deviceAChange).toBeDefined();
        expect(deviceAChange.days?.['2026-03-15']?.tl).toBe('from device A');
    });
});
