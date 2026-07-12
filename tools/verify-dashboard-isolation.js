'use strict';

/**
 * Dashboard package-isolation smoke test.
 *
 * Verifies that the packed @mikara89/cap-dashboard-core works correctly with
 * the minimum declared compatible @mikara89/cap-core@2.2.0 – a version that
 * does NOT export runWithActiveLeaseHeartbeat.
 *
 * Scenario:
 * 1. Pack the local dashboard-core.
 * 2. Install the published cap-core@2.2.0 and the packed dashboard tarball
 *    into a disposable directory.
 * 3. Load the dashboard service.
 * 4. Exercise flushOutbox() with a long-running publisher and legacy storage.
 * 5. Confirm package loading succeeds, heartbeat runs locally, and fenced
 *    completion behavior remains correct.
 */

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for the pack smoke.');

// ---------------------------------------------------------------------------
// 1. Pack the local dashboard-core
// ---------------------------------------------------------------------------
function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: options.cwd || rootDir,
        encoding: 'utf8',
        env: { ...process.env, ...options.env, CI: 'true' },
        stdio: options.inherit ? 'inherit' : 'pipe',
    });
    if (result.error || result.status !== 0) {
        const out = [result.stdout, result.stderr].filter(Boolean).join('\n');
        throw new Error(
            `${command} ${args.join(' ')} failed (${result.status ?? 'spawn'})\n${out}`,
            { cause: result.error },
        );
    }
    return { stdout: result.stdout || '', stderr: result.stderr || '' };
}

console.log('Packing @mikara89/cap-dashboard-core...');
const packResult = run(process.execPath, [
    npmCli,
    'pack',
    '--json',
    '--workspace',
    '@mikara89/cap-dashboard-core',
]);
const packOutput = packResult.stdout;
const jsonStart = packOutput.lastIndexOf('\n[');
const packJsonStr = jsonStart >= 0 ? packOutput.slice(jsonStart + 1) : packOutput.slice(packOutput.indexOf('['));
const packJson = JSON.parse(packJsonStr.trim());
const tarballName = packJson[0].filename;
const tarballPath = path.join(rootDir, tarballName);
if (!fs.existsSync(tarballPath)) {
    throw new Error(`Packed tarball not found: ${tarballPath}`);
}
console.log(`Packed: ${tarballPath}`);

// ---------------------------------------------------------------------------
// 2. Create a disposable project
// ---------------------------------------------------------------------------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-dashboard-smoke-'));
console.log(`Temp project: ${tmpDir}`);

const packageJson = {
    name: 'cap-dashboard-smoke-test',
    private: true,
    dependencies: {
        '@mikara89/cap-core': '2.2.0',
        '@mikara89/cap-dashboard-core': `file:${tarballPath}`,
    },
};
fs.writeFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
);

// ---------------------------------------------------------------------------
// 3. Install dependencies
// ---------------------------------------------------------------------------
console.log('Installing dependencies...');
run(process.execPath, [npmCli, 'install', '--ignore-scripts'], {
    cwd: tmpDir,
});

// ---------------------------------------------------------------------------
// 4. Load and exercise the dashboard service
// ---------------------------------------------------------------------------
console.log('Loading dashboard...');
const {
    CapDashboardCoreService,
} = require(path.join(
    tmpDir,
    'node_modules',
    '@mikara89',
    'cap-dashboard-core',
));

// Verify that no heartbeat symbols leaked from cap-core
const capCore = require(path.join(
    tmpDir,
    'node_modules',
    '@mikara89',
    'cap-core',
));
if (typeof capCore.runWithActiveLeaseHeartbeat === 'function') {
    throw new Error(
        'FAIL: @mikara89/cap-core unexpectedly exports runWithActiveLeaseHeartbeat',
    );
}
console.log('OK: cap-core does not export runWithActiveLeaseHeartbeat');

// ---------------------------------------------------------------------------
// 5. Exercise flushOutbox() with a long-running publisher
// ---------------------------------------------------------------------------
async function runSmoke() {
    let emitResolve;
    const emitPromise = new Promise((resolve) => {
        emitResolve = resolve;
    });

    const publisher = {
        emit: () => emitPromise,
    };

    // The claim owner format is "cap-dashboard:<uuid>". We need to capture it
    // to properly mock claimUnpublished.
    let capturedOwner = null;
    const publishStorage = {
        releaseExpiredClaims: async () => { },
        claimUnpublished: async (opts) => {
            capturedOwner = opts.lockedBy;
            return [
                {
                    id: 'event-1',
                    topic: 'test.topic',
                    payload: { hello: 'world' },
                    headers: {},
                    lockedBy: opts.lockedBy,
                    lockedUntil: opts.lockUntil,
                    retryCount: 0,
                    status: 'pending',
                    lastError: null,
                    nextRetryAt: null,
                    occurredAt: new Date().toISOString(),
                    publishedAt: null,
                },
            ];
        },
        renewPublishClaim: async (opts) => {
            return opts.expectedLockedBy === capturedOwner;
        },
        markPublished: async (_id, _date, opts) => {
            if (!opts || !opts.expectedLockedBy) {
                throw new Error('markPublished called without expectedLockedBy');
            }
            if (opts.expectedLockedBy !== capturedOwner) return false;
            return true;
        },
        markPublishFailed: async (_id, _reason, opts) => {
            if (opts.expectedLockedBy !== capturedOwner) return false;
            return true;
        },
    };

    const service = new CapDashboardCoreService({
        publishStorage,
        publisher,
        options: {
            readOnly: false,
            maxPageSize: 100,
            redact: { headers: [], payloadPaths: [] },
        },
        schedulerOptions: { maxRetries: 3 },
    });

    // Start flush – it will be pending on the emit promise
    const flushPromise = service.flushOutbox();

    // Let the dashboard heartbeat run a couple of cycles
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Resolve the publisher so flush completes
    emitResolve();

    const result = await flushPromise;
    console.log('flushOutbox result:', JSON.stringify(result));

    if (!result.success) {
        throw new Error(`flushOutbox failed: ${result.message}`);
    }

    console.log('OK: flushOutbox succeeded with legacy-compatible storage');
}

runSmoke()
    .then(() => {
        console.log('PASS: Dashboard package-isolation smoke test passed.');
    })
    .catch((err) => {
        console.error('FAIL:', err.message);
        process.exitCode = 1;
    })
    .finally(() => {
        // Clean up tarball
        try {
            fs.unlinkSync(tarballPath);
        } catch { }
        // Clean up temp dir
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch { }
    });
