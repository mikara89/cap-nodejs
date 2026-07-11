'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  ReleaseToolError,
  assertCleanTree,
  assertPlanInvariants,
  assertSimulatedPlanMatches,
  bootstrapConfirmation,
  buildBootstrapPackages,
  buildReleaseCommand,
  coordinatedMajorConfirmation,
  coordinatedTagCommit,
  createBootstrapTags,
  discoverPackages,
  distTagFor,
  executePlan,
  hasReleaseRelevantCommit,
  isReleaseCommit,
  normalizeInputs,
  normalizeDevDepFileRefs,
  normalizePackageForBootstrap,
  normalizePublishConfigForBootstrap,
  packageJsonSemanticallyChanged,
  packageTag,
  requiredDependents,
  recoveryCommand,
  sourceFilesChanged,
  simulateLernaVersions,
  validatePlanFile,
  validatePostVersionState,
  verifyConfiguration,
} = require('./release-tool');

const rootDir = path.resolve(__dirname, '..');
const lernaCli = path.join(rootDir, 'node_modules', 'lerna', 'dist', 'cli.js');
const releaseWorkflow = fs.readFileSync(
  path.join(rootDir, '.github', 'workflows', 'release.yml'),
  'utf8',
);
const ciWorkflow = fs.readFileSync(
  path.join(rootDir, '.github', 'workflows', 'ci.yml'),
  'utf8',
);
const commandTimeoutMs = 60_000;

test('current repository accepts independent package versions', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  const lerna = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'lerna.json'), 'utf8'),
  );

  assert.equal(manifest.private, true);
  assert.deepEqual(manifest.workspaces, ['libs/*']);
  assert.deepEqual(lerna.packages, ['libs/*']);
  assert.equal(lerna.version, 'independent');
  const result = verifyConfiguration(rootDir);
  assert.ok(result.packages.length > 0);
  assert.ok(
    result.packages.every((pkg) => pkg.relativeDir.startsWith('libs/')),
  );
});

// --- Independent transport baseline tests ---
// Each new 0.0.0 transport must produce 0.1.0 on first feat
// (or 0.1.0-beta.0 on prerelease) without disturbing stable packages.
for (const [label, pkgId, pkgName, commitMsg] of [
  ['Kafka', 'kafka', '@fixture/kafka', 'feat: add Kafka transport'],
  ['AWS SNS/SQS', 'aws', '@fixture/aws', 'feat(aws): add AWS SNS/SQS transport'],
  ['RabbitMQ', 'rabbitmq', '@fixture/rabbitmq', 'feat: add RabbitMQ transport'],
]) {
  test(`first ${label} feat selects only the independent package at 0.1.0`, () =>
    withFixture(
      [
        { id: 'core', name: '@fixture/core', version: '2.2.0' },
        { id: pkgId, name: pkgName, version: '0.0.0' },
      ],
      (cwd) => {
        addCommit(cwd, pkgId, commitMsg);
        const plan = runVersion(cwd, ['--conventional-commits']);
        assert.equal(plan['@fixture/core'].version, '2.2.0');
        assert.equal(plan[pkgName].version, '0.1.0');
      },
    ));

  test(`first ${label} feature beta selects only 0.1.0-beta.0`, () =>
    withFixture(
      [
        { id: 'core', name: '@fixture/core', version: '2.2.0' },
        { id: pkgId, name: pkgName, version: '0.0.0' },
      ],
      (cwd) => {
        addCommit(cwd, pkgId, commitMsg);
        const plan = runVersion(cwd, [
          '--conventional-commits',
          '--conventional-prerelease',
          '--preid',
          'beta',
        ]);
        assert.equal(plan['@fixture/core'].version, '2.2.0');
        assert.equal(plan[pkgName].version, '0.1.0-beta.0');
      },
    ));
}

test('root, docs, and admin-only changes select no package candidates', () => {
  const cwd = createFixture([
    { id: 'core', name: '@fixture/core', version: '2.2.0' },
    { id: 'rabbitmq', name: '@fixture/rabbitmq', version: '0.0.0' },
  ]);
  const rootManifestPath = path.join(cwd, 'package.json');
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));
  rootManifest.version = '2.4.0';
  writeJson(rootManifestPath, rootManifest);
  fs.writeFileSync(path.join(cwd, 'README.md'), '# Roadmap administration\n');
  fs.writeFileSync(
    path.join(cwd, 'libs', 'rabbitmq', 'README.md'),
    '# RabbitMQ documentation\n',
  );
  fs.mkdirSync(path.join(cwd, '.github', 'workflows'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.github', 'workflows', 'ci.yml'),
    'name: fixture-ci\n',
  );
  command('git', ['add', '.'], cwd);
  command(
    'git',
    ['commit', '--quiet', '-m', 'chore: update roadmap docs'],
    cwd,
  );

  const plan = runVersion(cwd, ['--conventional-commits']);

  assert.equal(
    JSON.parse(fs.readFileSync(rootManifestPath, 'utf8')).version,
    '2.4.0',
  );
  assert.equal(plan['@fixture/core'].version, '2.2.0');
  assert.equal(plan['@fixture/rabbitmq'].version, '0.0.0');
});

function command(commandName, args, cwd, options = {}) {
  const timeout = options.timeout ?? commandTimeoutMs;
  const result = spawnSync(commandName, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true', GH_TOKEN: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    killSignal: 'SIGTERM',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const reason =
      result.error?.code === 'ETIMEDOUT'
        ? `timed out after ${timeout}ms`
        : result.error
          ? `failed to start: ${result.error.message}`
          : `failed (${result.status ?? result.signal ?? 'unknown'})`;
    throw new Error(
      `${commandName} ${args.join(' ')} ${reason}\nstdout:\n${result.stdout || ''}\nstderr:\n${result.stderr || ''}`,
      { cause: result.error },
    );
  }
  return result.stdout;
}

test('external command failures are bounded and preserve diagnostics', () => {
  assert.throws(
    () =>
      command(
        process.execPath,
        [
          '-e',
          "process.stdout.write('started-out'); process.stderr.write('started-err'); setInterval(() => {}, 1_000)",
        ],
        rootDir,
        { timeout: 500 },
      ),
    (error) => {
      assert.match(error.message, /timed out after 500ms/);
      assert.match(error.message, /node(?:\.exe)? -e/iu);
      assert.match(error.message, /stdout:\nstarted-out/);
      assert.match(error.message, /stderr:\nstarted-err/);
      return true;
    },
  );
});

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(specs) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-release-test-'));
  writeJson(path.join(cwd, 'package.json'), {
    name: 'release-fixture',
    private: true,
    version: '0.0.0',
    workspaces: ['libs/*'],
  });
  writeJson(path.join(cwd, 'lerna.json'), {
    packages: ['libs/*'],
    version: 'independent',
    npmClient: 'npm',
    command: {
      version: {
        conventionalCommits: true,
        allowBranch: 'main',
        changelogPreset: 'conventionalcommits',
        excludeDependents: true,
        ignoreChanges: [
          '**/*.spec.ts',
          '**/*.test.ts',
          '**/test/**',
          '**/tests/**',
          '**/__tests__/**',
          '**/fixtures/**',
          '**/*.md',
          '**/tsconfig*.json',
        ],
      },
    },
  });

  for (const spec of specs) {
    const dir = path.join(cwd, 'libs', spec.id);
    const manifest = {
      name: spec.name,
      version: spec.version,
      main: 'index.js',
      license: 'MIT',
      ...(spec.dependencies ? { dependencies: spec.dependencies } : {}),
      ...(spec.peerDependencies
        ? { peerDependencies: spec.peerDependencies }
        : {}),
      ...(spec.devDependencies
        ? { devDependencies: spec.devDependencies }
        : {}),
    };
    writeJson(path.join(dir, 'package.json'), manifest);
    fs.writeFileSync(
      path.join(dir, 'index.js'),
      `'use strict';\nmodule.exports = '${spec.name}';\n`,
    );
  }

  command('git', ['init', '--initial-branch=main', '--quiet'], cwd);
  command('git', ['config', 'user.email', 'release-test@example.com'], cwd);
  command('git', ['config', 'user.name', 'Release Test'], cwd);
  command(
    'git',
    ['remote', 'add', 'origin', 'https://github.com/mikara89/cap-nodejs.git'],
    cwd,
  );
  command('git', ['add', '.'], cwd);
  command('git', ['commit', '--quiet', '-m', 'chore: baseline'], cwd);

  // Create initial annotated tags so Lerna can determine the release baseline.
  // Without tags, Lerna falls back to "Assuming all packages changed" and
  // versions every package, defeating excludeDependents.
  for (const spec of specs) {
    command(
      'git',
      [
        'tag',
        '-a',
        `${spec.name}@${spec.version}`,
        '-m',
        `${spec.name}@${spec.version}`,
      ],
      cwd,
    );
  }

  return cwd;
}

function addCommit(cwd, id, message) {
  fs.appendFileSync(path.join(cwd, 'libs', id, 'index.js'), `// ${message}\n`);
  command('git', ['add', '.'], cwd);
  command('git', ['commit', '--quiet', '-m', message], cwd);
}

function runVersion(cwd, args) {
  command(
    process.execPath,
    [
      lernaCli,
      'version',
      ...args,
      '--yes',
      '--no-git-tag-version',
      '--no-push',
      '--ignore-scripts',
    ],
    cwd,
  );
  const versions = {};
  for (const entry of fs.readdirSync(path.join(cwd, 'libs'))) {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(cwd, 'libs', entry, 'package.json')),
    );
    versions[manifest.name] = manifest;
  }
  return versions;
}

function withFixture(specs, fn) {
  const cwd = createFixture(specs);
  try {
    return fn(cwd);
  } finally {
    fs.rmSync(cwd, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

function createPostVersionFixture(specs) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-post-version-test-'));
  const rootManifest = {
    name: 'release-fixture',
    private: true,
    version: '2.4.1',
    workspaces: ['libs/*'],
  };
  writeJson(path.join(cwd, 'package.json'), rootManifest);
  writeJson(path.join(cwd, 'lerna.json'), {
    packages: ['libs/*'],
    version: 'independent',
    npmClient: 'npm',
    command: {
      version: {
        conventionalCommits: true,
        createRelease: 'github',
        allowBranch: 'main',
        changelogPreset: 'conventionalcommits',
        excludeDependents: true,
        ignoreChanges: [
          '**/*.spec.ts',
          '**/*.test.ts',
          '**/test/**',
          '**/tests/**',
          '**/__tests__/**',
          '**/fixtures/**',
          '**/*.md',
          '**/tsconfig*.json',
        ],
      },
    },
  });
  const lockfile = {
    name: rootManifest.name,
    version: rootManifest.version,
    lockfileVersion: 3,
    requires: true,
    packages: { '': rootManifest },
  };
  for (const spec of specs) {
    const relativeDir = `libs/${spec.id}`;
    const manifest = {
      name: spec.name,
      version: spec.version,
      main: 'index.js',
      license: 'MIT',
      publishConfig: {
        registry: 'https://registry.npmjs.org/',
        access: 'public',
      },
      repository: { url: 'https://github.com/mikara89/cap-nodejs' },
      ...(spec.dependencies ? { dependencies: spec.dependencies } : {}),
    };
    writeJson(path.join(cwd, relativeDir, 'package.json'), manifest);
    fs.writeFileSync(
      path.join(cwd, relativeDir, 'index.js'),
      `'use strict';\nmodule.exports = '${spec.name}';\n`,
    );
    lockfile.packages[relativeDir] = manifest;
    lockfile.packages[`node_modules/${spec.name}`] = {
      resolved: relativeDir,
      link: true,
    };
  }
  writeJson(path.join(cwd, 'package-lock.json'), lockfile);

  command('git', ['init', '--initial-branch=main', '--quiet'], cwd);
  command('git', ['config', 'user.email', 'release-test@example.com'], cwd);
  command('git', ['config', 'user.name', 'Release Test'], cwd);
  command('git', ['add', '.'], cwd);
  command('git', ['commit', '--quiet', '-m', 'chore: baseline'], cwd);
  for (const spec of specs) {
    command(
      'git',
      ['tag', '-a', `${spec.name}@${spec.version}`, '-m', 'baseline'],
      cwd,
    );
  }
  return cwd;
}

function withPostVersionFixture(fn) {
  const cwd = createPostVersionFixture([
    { id: 'core', name: '@mikara89/cap-core', version: '2.2.0' },
    {
      id: 'storage-knex',
      name: '@mikara89/cap-storage-knex',
      version: '2.2.1',
    },
    {
      id: 'transport-rabbitmq',
      name: '@mikara89/cap-transport-rabbitmq',
      version: '0.0.0',
    },
    { id: 'equal-root', name: '@mikara89/cap-equal-root', version: '2.4.1' },
  ]);
  try {
    return fn(cwd);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

function bumpFixturePackage(cwd, name, version) {
  const pkg = discoverPackages(cwd).find((candidate) => candidate.name === name);
  assert.ok(pkg, `Missing fixture package ${name}`);
  const manifest = JSON.parse(fs.readFileSync(pkg.manifestPath, 'utf8'));
  manifest.version = version;
  writeJson(pkg.manifestPath, manifest);
  const lockfilePath = path.join(cwd, 'package-lock.json');
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  lockfile.packages[pkg.relativeDir].version = version;
  writeJson(lockfilePath, lockfile);
}

test('valid simulated patch release state passes post-version validation', () =>
  withPostVersionFixture((cwd) => {
    bumpFixturePackage(cwd, '@mikara89/cap-storage-knex', '2.2.2');
    const result = validatePostVersionState(cwd, { dependencyRoot: rootDir });
    assert.equal(
      result.packages.find((pkg) => pkg.name === '@mikara89/cap-storage-knex')
        ?.version,
      '2.2.2',
    );
  }));

test('post-version validation permits a package version equal to the private root', () =>
  withPostVersionFixture((cwd) => {
    const result = validatePostVersionState(cwd, { dependencyRoot: rootDir });
    assert.equal(
      result.packages.find((pkg) => pkg.name === '@mikara89/cap-equal-root')
        ?.version,
      '2.4.1',
    );
  }));

test('Lerna-generated independent patch state passes post-version validation', () =>
  withPostVersionFixture((cwd) => {
    const sourcePath = path.join(cwd, 'libs', 'storage-knex', 'index.js');
    fs.appendFileSync(sourcePath, '\n// simulated independent patch release\n');
    command('git', ['add', sourcePath], cwd);
    command(
      'git',
      ['commit', '--quiet', '-m', 'fix(knex): simulated patch release'],
      cwd,
    );
    const planned = simulateLernaVersions(
      [
        'publish',
        '--conventional-commits',
        '--create-release',
        'github',
        '--yes',
        '--registry',
        'https://registry.npmjs.org/',
        '--dist-tag',
        'latest',
      ],
      cwd,
      { dependencyRoot: rootDir },
    );
    assert.deepEqual(planned, [
      {
        name: '@mikara89/cap-storage-knex',
        oldVersion: '2.2.1',
        newVersion: '2.2.2',
        tag: '@mikara89/cap-storage-knex@2.2.2',
        githubRelease: '@mikara89/cap-storage-knex@2.2.2',
      },
    ]);
  }));

test('post-version validation rejects manifest and lockfile mismatch', () =>
  withPostVersionFixture((cwd) => {
    const pkg = discoverPackages(cwd).find(
      (candidate) => candidate.name === '@mikara89/cap-storage-knex',
    );
    const manifest = JSON.parse(fs.readFileSync(pkg.manifestPath, 'utf8'));
    manifest.version = '2.2.2';
    writeJson(pkg.manifestPath, manifest);
    assert.throws(
      () => validatePostVersionState(cwd, { dependencyRoot: rootDir }),
      /package-lock\.json does not match @mikara89\/cap-storage-knex@2\.2\.2/,
    );
  }));

test('post-version validation rejects invalid package versions', () =>
  withPostVersionFixture((cwd) => {
    bumpFixturePackage(cwd, '@mikara89/cap-core', 'not-a-version');
    assert.throws(
      () => validatePostVersionState(cwd, { dependencyRoot: rootDir }),
      /@mikara89\/cap-core has invalid version not-a-version/,
    );
  }));

function signedPlan(plan) {
  const copy = { ...plan };
  delete copy.integrity;
  return {
    ...plan,
    integrity: crypto.createHash('sha256').update(JSON.stringify(copy)).digest('hex'),
  };
}

test('release executor does not invoke publish when post-version validation fails', async () => {
  let published = false;
  const plan = signedPlan({
    schemaVersion: 1,
    headSha: command('git', ['rev-parse', 'HEAD'], rootDir).trim(),
    inputs: {
      operation: 'release',
      channel: 'stable',
      coordinatedMajor: false,
      confirmation: '',
    },
    noChanges: false,
    packages: [
      {
        name: '@mikara89/cap-storage-knex',
        oldVersion: '2.2.1',
        newVersion: '2.2.2',
      },
    ],
    command: { args: ['publish', '--yes'] },
  });
  await assert.rejects(
    executePlan(plan, {
      cwd: rootDir,
      checkClean: false,
      checkRemote: false,
      simulate: () => {
        throw new ReleaseToolError('simulated manifest/lockfile mismatch');
      },
      run: () => {
        published = true;
      },
    }),
    /simulated manifest\/lockfile mismatch/,
  );
  assert.equal(published, false);
});

test('release executor does not invoke publish when generated versions drift from plan', async () => {
  let published = false;
  const plan = signedPlan({
    schemaVersion: 1,
    headSha: command('git', ['rev-parse', 'HEAD'], rootDir).trim(),
    inputs: {
      operation: 'release',
      channel: 'stable',
      coordinatedMajor: false,
      confirmation: '',
    },
    noChanges: false,
    packages: [
      {
        name: '@mikara89/cap-storage-knex',
        oldVersion: '2.2.1',
        newVersion: '2.2.2',
      },
    ],
    command: { args: ['publish', '--yes'] },
  });
  await assert.rejects(
    executePlan(plan, {
      cwd: rootDir,
      checkClean: false,
      checkRemote: false,
      simulate: () => [
        {
          name: '@mikara89/cap-storage-knex',
          oldVersion: '2.2.1',
          newVersion: '2.2.3',
        },
      ],
      run: () => {
        published = true;
      },
    }),
    /Simulated post-version state no longer matches the approved release plan/,
  );
  assert.equal(published, false);
});

test('simulated plan comparison is independent of package order', () => {
  const plan = {
    packages: [
      {
        name: '@mikara89/cap-core',
        oldVersion: '2.2.0',
        newVersion: '2.2.1',
      },
      {
        name: '@mikara89/cap-storage-knex',
        oldVersion: '2.2.1',
        newVersion: '2.2.2',
      },
    ],
  };
  assert.doesNotThrow(() =>
    assertSimulatedPlanMatches(plan, [...plan.packages].reverse()),
  );
});

test('root-only roadmap version change creates zero Lerna candidates', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '1.0.0' },
      { id: 'b', name: '@fixture/b', version: '2.0.0' },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.version = '2.4.0';
      writeJson(manifestPath, manifest);
      command('git', ['add', 'package.json'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: start v2.4 roadmap'],
        cwd,
      );

      const versions = runVersion(cwd, ['--conventional-commits']);

      assert.equal(versions['@fixture/a'].version, '1.0.0');
      assert.equal(versions['@fixture/b'].version, '2.0.0');
    },
  ));

function bootstrapTestOptions(overrides = {}) {
  return {
    commitExists: () => true,
    packageAtCommit: (pkg, commit) =>
      commit === 'v2.2.0'
        ? undefined
        : { name: pkg.name, version: pkg.version },
    verifyArtifact: async (pkg) => ({
      tarball: `https://registry.npmjs.org/${pkg.name}/-/${pkg.name.split('/').pop()}-${pkg.version}.tgz`,
      integrity: 'sha512-test',
      shasum: 'test',
    }),
    ...overrides,
  };
}

for (const [label, commit, expected] of [
  ['patch', 'fix: correct behavior', '1.0.1'],
  ['minor', 'feat: add behavior', '1.1.0'],
  ['major', 'refactor!: replace behavior', '2.0.0'],
  [
    'major from BREAKING CHANGE',
    'refactor: replace behavior\n\nBREAKING CHANGE: remove the old API',
    '2.0.0',
  ],
]) {
  test(`installed Lerna calculates a normal ${label} release`, () =>
    withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
      addCommit(cwd, 'a', commit);
      const versions = runVersion(cwd, ['--conventional-commits']);
      assert.equal(versions['@fixture/a'].version, expected);
    }));
}

test('package-specific breaking change major-bumps its package and updates its dependent', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '1.0.0' },
      {
        id: 'b',
        name: '@fixture/b',
        version: '1.0.0',
        dependencies: { '@fixture/a': '^1.0.0' },
      },
    ],
    (cwd) => {
      addCommit(cwd, 'a', 'feat!: replace package contract');
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--force-publish=@fixture/b',
      ]);
      assert.equal(versions['@fixture/a'].version, '2.0.0');
      assert.equal(versions['@fixture/b'].version, '1.0.1');
      assert.equal(versions['@fixture/b'].dependencies['@fixture/a'], '^2.0.0');
    },
  ));

test('verified Lerna config leaves semver-compatible dependents unchanged', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '1.0.0' },
      {
        id: 'b',
        name: '@fixture/b',
        version: '1.0.0',
        dependencies: { '@fixture/a': '^1.0.0' },
      },
    ],
    (cwd) => {
      addCommit(cwd, 'a', 'feat: add compatible behavior');
      const versions = runVersion(cwd, ['--conventional-commits']);
      assert.equal(versions['@fixture/a'].version, '1.1.0');
      assert.equal(versions['@fixture/b'].version, '1.0.0');
      assert.equal(versions['@fixture/b'].dependencies['@fixture/a'], '^1.0.0');
    },
  ));

test('only incompatible internal dependents are forced into a release', () => {
  const packages = [
    { name: '@fixture/a', manifest: { dependencies: {} } },
    {
      name: '@fixture/compatible',
      manifest: { dependencies: { '@fixture/a': '^1.0.0' } },
    },
    {
      name: '@fixture/incompatible',
      manifest: { dependencies: { '@fixture/a': '~1.0.0' } },
    },
  ];
  assert.deepEqual(
    requiredDependents(packages, [
      { name: '@fixture/a', oldVersion: '1.0.0', newVersion: '1.1.0' },
    ]),
    ['@fixture/incompatible'],
  );
});

test('non-release commit relevance guard produces no release signal', () => {
  assert.equal(isReleaseCommit('test: add coverage'), false);
  assert.equal(isReleaseCommit('docs: explain release'), false);
  assert.equal(isReleaseCommit('chore: refresh lockfile'), false);
  assert.equal(isReleaseCommit('fix: correct release'), true);
  assert.equal(isReleaseCommit('feat!: break contract'), true);
  assert.equal(
    isReleaseCommit('refactor: reorganize', 'BREAKING CHANGE: remove API'),
    true,
  );
  assert.equal(
    hasReleaseRelevantCommit([
      { subject: 'docs: clarify behavior', body: '' },
      { subject: 'test: add coverage', body: '' },
    ]),
    false,
  );
  assert.equal(
    hasReleaseRelevantCommit([
      { subject: 'docs: clarify behavior', body: '' },
      { subject: 'fix: correct behavior', body: '' },
    ]),
    true,
  );
});

test('release planning rejects a dirty worktree', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    assert.doesNotThrow(() => assertCleanTree(cwd));
    fs.appendFileSync(path.join(cwd, 'libs', 'a', 'index.js'), '// dirty\n');
    assert.throws(() => assertCleanTree(cwd), /clean worktree/);
  }));

test('patch beta release uses beta dist-tag and prerelease flags', () => {
  const commandSpec = buildReleaseCommand({
    operation: 'release',
    channel: 'beta',
  });
  assert.equal(commandSpec.distTag, 'beta');
  assert.deepEqual(commandSpec.args.slice(0, 4), [
    'publish',
    '--conventional-prerelease',
    '--preid',
    'beta',
  ]);
  withFixture([{ id: 'a', name: '@fixture/a', version: '2.3.0' }], (cwd) => {
    addCommit(cwd, 'a', 'fix: beta correction');
    const versions = runVersion(cwd, [
      '--conventional-commits',
      '--conventional-prerelease',
      '--preid',
      'beta',
    ]);
    assert.equal(versions['@fixture/a'].version, '2.3.1-beta.0');
  });
});

test('feature beta release starts the next minor beta line', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '2.3.0' }], (cwd) => {
    addCommit(cwd, 'a', 'feat: beta feature');
    const versions = runVersion(cwd, [
      '--conventional-commits',
      '--conventional-prerelease',
      '--preid',
      'beta',
    ]);
    assert.equal(versions['@fixture/a'].version, '2.4.0-beta.0');
  }));

test('beta increment preserves its base version', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '2.4.0-beta.0' }],
    (cwd) => {
      addCommit(cwd, 'a', 'fix: refine beta');
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--conventional-prerelease',
        '--preid',
        'beta',
      ]);
      assert.equal(versions['@fixture/a'].version, '2.4.0-beta.1');
    },
  ));

test('beta-to-RC transition and RC increment preserve the intended base', () => {
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '2.4.0-beta.1' }],
    (cwd) => {
      addCommit(cwd, 'a', 'fix: prepare rc');
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--conventional-prerelease',
        '--preid',
        'rc',
      ]);
      assert.equal(versions['@fixture/a'].version, '2.4.0-rc.0');
    },
  );
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '2.4.0-rc.0' }],
    (cwd) => {
      addCommit(cwd, 'a', 'fix: refine rc');
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--conventional-prerelease',
        '--preid',
        'rc',
      ]);
      assert.equal(versions['@fixture/a'].version, '2.4.0-rc.1');
    },
  );
});

test('RC graduation removes the suffix without another semantic bump', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '2.4.0-rc.1' }],
    (cwd) => {
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--conventional-graduate',
      ]);
      assert.equal(versions['@fixture/a'].version, '2.4.0');
    },
  ));

test('independent graduation explicitly selects its prerelease package', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '2.4.0-rc.1' }],
    (cwd) => {
      const commandSpec = buildReleaseCommand(
        { operation: 'graduate', channel: 'stable' },
        { graduatePackages: ['@fixture/a'] },
      );
      assert(commandSpec.args.includes('--conventional-graduate=@fixture/a'));
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--conventional-graduate=@fixture/a',
      ]);
      assert.equal(versions['@fixture/a'].version, '2.4.0');
    },
  ));

test('coordinated premajor beta explicitly bumps every package', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '2.3.0' },
      { id: 'b', name: '@fixture/b', version: '1.7.0' },
    ],
    (cwd) => {
      const versions = runVersion(cwd, [
        'premajor',
        '--force-publish=*',
        '--conventional-commits',
        '--preid',
        'beta',
      ]);
      assert.equal(versions['@fixture/a'].version, '3.0.0-beta.0');
      assert.equal(versions['@fixture/b'].version, '2.0.0-beta.0');
    },
  ));

test('coordinated stable major explicitly bumps every package', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '2.3.0' },
      { id: 'b', name: '@fixture/b', version: '1.7.0' },
    ],
    (cwd) => {
      const versions = runVersion(cwd, [
        'major',
        '--force-publish=*',
        '--conventional-commits',
      ]);
      assert.equal(versions['@fixture/a'].version, '3.0.0');
      assert.equal(versions['@fixture/b'].version, '2.0.0');
    },
  ));

test('coordinated beta-to-RC and stable graduation include every participant', () => {
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '3.0.0-beta.1' },
      { id: 'b', name: '@fixture/b', version: '3.0.0-beta.1' },
    ],
    (cwd) => {
      const versions = runVersion(cwd, [
        'prerelease',
        '--force-publish=*',
        '--conventional-commits',
        '--preid',
        'rc',
      ]);
      assert.equal(versions['@fixture/a'].version, '3.0.0-rc.0');
      assert.equal(versions['@fixture/b'].version, '3.0.0-rc.0');
    },
  );
  withFixture(
    [
      { id: 'a', name: '@fixture/a', version: '3.0.0-rc.1' },
      { id: 'b', name: '@fixture/b', version: '3.0.0-rc.1' },
    ],
    (cwd) => {
      const versions = runVersion(cwd, [
        '--conventional-commits',
        '--conventional-graduate=*',
        '--force-conventional-graduate',
      ]);
      assert.equal(versions['@fixture/a'].version, '3.0.0');
      assert.equal(versions['@fixture/b'].version, '3.0.0');
    },
  );
});

test('coordinated continuation requires all package tags on one version commit', () => {
  const packages = [
    { name: '@fixture/a', version: '3.0.0-beta.1' },
    { name: '@fixture/b', version: '2.0.0-beta.1' },
  ];
  assert.equal(
    coordinatedTagCommit(packages, '.', () => 'shared-version-commit'),
    'shared-version-commit',
  );
  assert.throws(
    () =>
      coordinatedTagCommit(packages, '.', (tag) =>
        tag.includes('/a@') ? 'commit-a' : 'commit-b',
      ),
    /shared Lerna version commit/,
  );
});

test('invalid input combinations are rejected', () => {
  const invalid = [
    { operation: 'graduate', channel: 'beta' },
    { operation: 'graduate', channel: 'rc' },
    {
      operation: 'bootstrap',
      channel: 'stable',
      coordinatedMajor: true,
      confirmation: bootstrapConfirmation,
    },
    {
      operation: 'bootstrap',
      channel: 'beta',
      confirmation: bootstrapConfirmation,
    },
    { operation: 'release', channel: 'stable', coordinatedMajor: true },
    { operation: 'bootstrap', channel: 'stable' },
  ];
  for (const input of invalid)
    assert.throws(() => normalizeInputs(input), ReleaseToolError);
});

test('dist-tag isolation and coordinated-major commands are explicit', () => {
  assert.equal(distTagFor('stable'), 'latest');
  assert.equal(distTagFor('beta'), 'beta');
  assert.equal(distTagFor('rc'), 'rc');

  const stable = buildReleaseCommand({
    operation: 'release',
    channel: 'stable',
    coordinatedMajor: true,
    confirmation: coordinatedMajorConfirmation,
  });
  assert.equal(stable.args[1], 'major');
  assert(stable.args.includes('--force-publish=*'));
  assert(stable.args.includes('latest'));

  const beta = buildReleaseCommand({
    operation: 'release',
    channel: 'beta',
    coordinatedMajor: true,
    confirmation: coordinatedMajorConfirmation,
  });
  assert.equal(beta.args[1], 'premajor');
  assert(beta.args.includes('beta'));
  assert(!beta.args.includes('latest'));
  assert(beta.args.includes('--create-release'));
  assert(beta.args.includes('github'));
  assert.equal(
    packageTag('@fixture/a', '2.4.0-beta.1'),
    '@fixture/a@2.4.0-beta.1',
  );
});

test('bootstrap plans exact npm baselines and rejects mismatched tags', async () => {
  const packages = [
    { name: '@fixture/published', version: '2.2.0' },
    { name: '@fixture/new', version: '1.0.0' },
  ];
  const fetchImpl = async (url) => {
    if (url.includes('published')) {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          versions: { '2.2.0': { gitHead: 'published-sha' } },
        }),
      };
    }
    return { status: 404, ok: false };
  };
  const items = await buildBootstrapPackages(packages, {
    ...bootstrapTestOptions(),
    head: 'current-sha',
    fetchImpl,
    getTagCommit: () => undefined,
  });
  assert.deepEqual(
    items.map((item) => [
      item.name,
      item.tagTarget,
      item.npmAction,
      item.tagAction,
      item.tagTiming,
    ]),
    [
      [
        '@fixture/published',
        'published-sha',
        'skip-existing',
        'create',
        'existing-artifact-verified',
      ],
      [
        '@fixture/new',
        'current-sha',
        'publish',
        'create',
        'after-successful-publish',
      ],
    ],
  );

  await assert.rejects(
    buildBootstrapPackages([packages[0]], {
      ...bootstrapTestOptions(),
      head: 'current-sha',
      fetchImpl,
      getTagCommit: () => 'wrong-sha',
    }),
    /expected published-sha/,
  );
  await assert.rejects(
    buildBootstrapPackages([packages[0]], {
      ...bootstrapTestOptions({ commitExists: () => false }),
      head: 'current-sha',
      fetchImpl,
      getTagCommit: () => undefined,
    }),
    /not present in the complete repository history/,
  );
  await assert.rejects(
    buildBootstrapPackages([{ name: '@fixture/stale', version: '1.0.0' }], {
      ...bootstrapTestOptions(),
      head: 'current-sha',
      fetchImpl: async () => ({
        status: 200,
        ok: true,
        json: async () => ({ versions: { '2.0.0': {} } }),
      }),
      getTagCommit: () => undefined,
    }),
    /will not backfill historical versions/,
  );
});

test('bootstrap pins new npm artifacts to the validated git head', () => {
  const commandSpec = buildReleaseCommand(
    {
      operation: 'bootstrap',
      channel: 'stable',
      confirmation: bootstrapConfirmation,
    },
    { gitHead: 'approved-head' },
  );
  assert.deepEqual(commandSpec.args.slice(-2), ['--git-head', 'approved-head']);
});

test('registry failure aborts bootstrap planning', async () => {
  await assert.rejects(
    buildBootstrapPackages([{ name: '@fixture/a', version: '1.0.0' }], {
      ...bootstrapTestOptions(),
      head: 'head',
      fetchImpl: async () => {
        throw new Error('registry offline');
      },
      getTagCommit: () => undefined,
    }),
    /registry offline/,
  );
});

test('bootstrap refuses absent source packages and historical source rebuilds', async () => {
  const missingResponse = async () => ({ status: 404, ok: false });
  await assert.rejects(
    buildBootstrapPackages(
      [
        {
          name: '@fixture/absent',
          version: '1.0.0',
          relativeDir: 'libs/absent',
        },
      ],
      {
        ...bootstrapTestOptions({ packageAtCommit: () => undefined }),
        head: 'head',
        fetchImpl: missingResponse,
        getTagCommit: () => undefined,
      },
    ),
    /does not exist with that identity/,
  );
  await assert.rejects(
    buildBootstrapPackages(
      [
        {
          name: '@fixture/historical',
          version: '2.2.0',
          relativeDir: 'libs/historical',
        },
      ],
      {
        ...bootstrapTestOptions({
          packageAtCommit: (pkg) => ({
            name: pkg.name,
            version: pkg.version,
          }),
        }),
        head: 'head',
        fetchImpl: missingResponse,
        getTagCommit: () => undefined,
      },
    ),
    /automated source rebuild is forbidden/,
  );
});

test('head-anchored bootstrap accepts published package with older gitHead and no source changes', async () => {
  const options = {
    ...bootstrapTestOptions(),
    head: 'head',
    sourceFilesChanged: () => false,
    fetchImpl: async () => ({
      status: 200,
      ok: true,
      json: async () => ({
        versions: {
          '1.0.0': {
            gitHead: 'old-head',
            dist: {
              tarball: 'https://registry.npmjs.org/x/-/x-1.0.0.tgz',
              integrity: 'sha512-test',
            },
          },
        },
        'dist-tags': { latest: '1.0.0' },
      }),
    }),
    getTagCommit: (tag) =>
      tag === '@fixture/a@1.0.0' ? 'old-head' : undefined,
  };
  const items = await buildBootstrapPackages(
    [{ name: '@fixture/a', version: '1.0.0' }],
    options,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].tag, '@fixture/a@1.0.0');
  assert.equal(items[0].tagTarget, 'head');
  assert.equal(items[0].tagAction, 'move');
  assert.equal(items[0].npmAction, 'skip-existing');
});

test('head-anchored bootstrap accepts tag at different commit when source is unchanged', async () => {
  // npm gitHead is 'npm-head' but the tag was placed at 'tag-commit'.
  // Source files are unchanged between both pairs — bootstrap should
  // anchor at HEAD and plan to move the tag.
  const options = {
    ...bootstrapTestOptions(),
    head: 'head',
    sourceFilesChanged: () => false,
    fetchImpl: async () => ({
      status: 200,
      ok: true,
      json: async () => ({
        versions: {
          '1.0.0': {
            gitHead: 'npm-head',
            dist: {
              tarball: 'https://registry.npmjs.org/x/-/x-1.0.0.tgz',
              integrity: 'sha512-test',
            },
          },
        },
        'dist-tags': { latest: '1.0.0' },
      }),
    }),
    getTagCommit: (tag) =>
      tag === '@fixture/a@1.0.0' ? 'tag-commit' : undefined,
  };
  const items = await buildBootstrapPackages(
    [{ name: '@fixture/a', version: '1.0.0' }],
    options,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].tagTarget, 'head');
  assert.equal(items[0].tagAction, 'move');
});

test('head-anchored bootstrap fails when published package has source changes', async () => {
  const options = {
    ...bootstrapTestOptions(),
    head: 'head',
    sourceFilesChanged: () => true,
    fetchImpl: async () => ({
      status: 200,
      ok: true,
      json: async () => ({
        versions: {
          '1.0.0': {
            gitHead: 'old-head',
            dist: {
              tarball: 'https://registry.npmjs.org/x/-/x-1.0.0.tgz',
              integrity: 'sha512-test',
            },
          },
        },
        'dist-tags': { latest: '1.0.0' },
      }),
    }),
    getTagCommit: (tag) =>
      tag === '@fixture/a@1.0.0' ? 'old-head' : undefined,
  };
  const items = await buildBootstrapPackages(
    [{ name: '@fixture/a', version: '1.0.0' }],
    options,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].tagTarget, 'old-head');
  assert.equal(items[0].tagAction, 'keep');
});

test('existing npm gitHead equal to HEAD still passes', async () => {
  const options = {
    ...bootstrapTestOptions(),
    head: 'same-head',
    fetchImpl: async () => ({
      status: 200,
      ok: true,
      json: async () => ({
        versions: {
          '1.0.0': {
            gitHead: 'same-head',
            dist: {
              tarball: 'https://registry.npmjs.org/x/-/x-1.0.0.tgz',
              integrity: 'sha512-test',
            },
          },
        },
        'dist-tags': { latest: '1.0.0' },
      }),
    }),
    getTagCommit: () => 'same-head',
  };
  const items = await buildBootstrapPackages(
    [{ name: '@fixture/a', version: '1.0.0' }],
    options,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].tagTarget, 'same-head');
  assert.equal(items[0].tagAction, 'keep');
});

test('partial publication recovery uses from-git without another version bump', () => {
  const commandLine = recoveryCommand('rc').join(' ');
  assert.match(commandLine, /lerna publish from-git/);
  assert.match(commandLine, /--dist-tag rc/);
  assert.doesNotMatch(commandLine, /conventional/);
  const lernaSource = fs.readFileSync(
    path.join(rootDir, 'node_modules', 'lerna', 'dist', 'index.js'),
    'utf8',
  );
  assert.match(lernaSource, /Package is already published/);
  assert.match(lernaSource, /E409/);
  assert.match(lernaSource, /EPUBLISHCONFLICT/);
});

test('tampered release plans fail integrity validation', () => {
  const plan = {
    schemaVersion: 1,
    headSha: 'head',
    inputs: normalizeInputs({ operation: 'release', channel: 'stable' }),
    packages: [],
    integrity: 'wrong',
  };
  assert.throws(() => validatePlanFile(plan), /integrity/);
});

test('plan invariants reject accidental latest prereleases and unrelated RC bases', () => {
  const packages = [{ name: '@fixture/a', version: '2.4.0-beta.1' }];
  assert.throws(
    () =>
      assertPlanInvariants(
        {
          inputs: normalizeInputs({ operation: 'release', channel: 'rc' }),
          distTag: 'latest',
          packages: [
            {
              name: '@fixture/a',
              oldVersion: '2.4.0-beta.1',
              newVersion: '3.0.0-rc.0',
            },
          ],
        },
        packages,
      ),
    ReleaseToolError,
  );
  assert.throws(
    () =>
      assertPlanInvariants(
        {
          inputs: normalizeInputs({ operation: 'release', channel: 'rc' }),
          distTag: 'rc',
          packages: [
            {
              name: '@fixture/a',
              oldVersion: '2.4.0-beta.1',
              newVersion: '3.0.0-rc.0',
            },
          ],
        },
        packages,
      ),
    /base version/,
  );
  assert.throws(
    () =>
      assertPlanInvariants(
        {
          inputs: normalizeInputs({ operation: 'graduate', channel: 'stable' }),
          distTag: 'latest',
          packages: [],
        },
        [{ name: '@fixture/a', version: '2.3.0' }],
      ),
    /at least one prerelease/,
  );
  assert.throws(
    () =>
      assertPlanInvariants(
        {
          inputs: normalizeInputs({
            operation: 'release',
            channel: 'stable',
            coordinatedMajor: true,
            confirmation: coordinatedMajorConfirmation,
          }),
          distTag: 'latest',
          packages: [
            {
              name: '@fixture/a',
              oldVersion: '2.4.0-beta.1',
              newVersion: '3.0.0',
            },
          ],
        },
        packages,
      ),
    /operation=graduate/,
  );
  assert.throws(
    () =>
      assertPlanInvariants(
        {
          inputs: normalizeInputs({ operation: 'release', channel: 'beta' }),
          distTag: 'beta',
          packages: [
            {
              name: '@fixture/a',
              oldVersion: '2.4.0-rc.1',
              newVersion: '2.4.0-beta.2',
            },
          ],
        },
        [{ name: '@fixture/a', version: '2.4.0-rc.1' }],
      ),
    /cannot move from rc to beta/,
  );
});

test('release workflow exposes only validated Lerna modes and protects publication', () => {
  for (const input of [
    'operation:',
    'channel:',
    'coordinated_major:',
    'confirmation:',
  ]) {
    assert.match(releaseWorkflow, new RegExp(`^      ${input}`, 'm'));
  }
  assert.doesNotMatch(
    releaseWorkflow,
    /release_package|bootstrap_npm|bootstrap_confirmation/,
  );
  assert.equal((releaseWorkflow.match(/fetch-depth: 0/g) || []).length, 2);
  assert.match(releaseWorkflow, /environment: npm-production/);
  assert.match(releaseWorkflow, /contents: write/);
  assert.match(releaseWorkflow, /id-token: write/);
  assert.match(releaseWorkflow, /GH_TOKEN: \$\{\{ secrets\.RELEASE_GITHUB_TOKEN \}\}/);
  assert.match(releaseWorkflow, /if: \$\{\{ inputs\.operation == 'bootstrap' \}\}/);
  assert.match(releaseWorkflow, /test:release-tooling/);
  assert.match(releaseWorkflow, /release-tool\.js plan/);
  assert.match(releaseWorkflow, /release-tool\.js execute/);
  assert.match(releaseWorkflow, /cancel-in-progress: false/);
  // Publish job must build workspace before executing the Lerna plan
  // so inter-package dist references (e.g. cap-core/dist) are resolved
  // during prepack builds.
  assert.match(
    releaseWorkflow.slice(releaseWorkflow.indexOf('publish:')),
    /npm run build/,
  );
  const publishSection = releaseWorkflow.slice(releaseWorkflow.indexOf('publish:'));
  const executeIndex = publishSection.indexOf('release-tool.js execute');
  const buildIndex = publishSection.indexOf('npm run build');
  assert.ok(
    buildIndex >= 0 && buildIndex < executeIndex,
    'Publish job must run workspace build before executing the Lerna plan',
  );
  assert.match(ciWorkflow, /npm run release:verify/);
  assert.match(ciWorkflow, /npm run test:release-tooling/);
});

test('sourceFilesChanged returns false when both commits are identical', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    assert.equal(
      sourceFilesChanged('HEAD', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      false,
    );
  }));

// --- Development validation guard tests ---

test('affected validation scripts do not modify versions or create tags', () => {
  const scripts = [
    'check:affected',
    'lint:affected',
    'build:affected',
    'test:affected',
    'pack:dry-run:affected',
  ];
  const rootManifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  for (const script of scripts) {
    const command = rootManifest.scripts[script];
    assert.ok(command, `Missing script: ${script}`);
    // Must not invoke release-tool.js or lerna version
    assert.doesNotMatch(
      command,
      /release-tool\.js|release:verify|release:plan|lerna\s+version/,
      `${script} must not trigger version bump or release`,
    );
    // Must not invoke git tag
    assert.doesNotMatch(
      command,
      /git\s+tag/,
      `${script} must not create git tags`,
    );
  }
});

test('release workflow trigger remains manual-only (workflow_dispatch)', () => {
  // Must only trigger on workflow_dispatch (no push/pull_request)
  const onSection = releaseWorkflow.slice(0, releaseWorkflow.indexOf('jobs:'));
  assert.match(onSection, /workflow_dispatch/);
  assert.doesNotMatch(onSection, /push:/);
  assert.doesNotMatch(onSection, /pull_request:/);
  assert.doesNotMatch(onSection, /schedule:/);
  // Must have npm-production environment protection
  assert.match(releaseWorkflow, /environment:\s*npm-production/);
  // Must have concurrency gate
  assert.match(releaseWorkflow, /concurrency:/);
  assert.match(releaseWorkflow, /cancel-in-progress:\s*false/);
});

test('CI workflow exists and does not publish', () => {
  // CI must never publish
  assert.doesNotMatch(ciWorkflow, /npm\s+publish/);
  assert.doesNotMatch(ciWorkflow, /lerna\s+publish/);
  assert.doesNotMatch(ciWorkflow, /npm-production/);
  assert.doesNotMatch(ciWorkflow, /id-token:\s*write/);
  // CI must validate release configuration
  assert.match(ciWorkflow, /release:verify/);
  assert.match(ciWorkflow, /test:release-tooling/);
});

test('new transport package baseline at version 0.0.0 is publish-ready', () => {
  const packages = discoverPackages(rootDir);
  const rabbitmq = packages.find(
    (pkg) => pkg.name === '@mikara89/cap-transport-rabbitmq',
  );
  const kafka = packages.find(
    (pkg) => pkg.name === '@mikara89/cap-transport-kafka',
  );
  assert.ok(rabbitmq, 'RabbitMQ package must exist');
  assert.ok(kafka, 'Kafka package must exist');
  assert.equal(rabbitmq.version, '0.0.0');
  assert.equal(kafka.version, '0.0.0');
  for (const pkg of [rabbitmq, kafka]) {
    assert.equal(pkg.manifest.publishConfig?.access, 'public');
    assert.equal(
      pkg.manifest.publishConfig?.registry,
      'https://registry.npmjs.org/',
    );
    assert.equal(
      pkg.manifest.repository?.url,
      'https://github.com/mikara89/cap-nodejs',
    );
  }
});

test('sourceFilesChanged: dependency change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    // Add a new dependency.
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.dependencies = { leftpad: '^1.0.0' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: add dep'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: peer dependency change is significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        peerDependencies: { react: '^18.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.peerDependencies.react = '^19.0.0';
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: bump peer'], cwd);
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: exports change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.exports = { '.': './dist/index.js' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: add exports'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: files allowlist change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.files = ['dist', 'README.md'];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: add files'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: .npmignore change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    fs.writeFileSync(path.join(cwd, 'libs', 'a', '.npmignore'), 'src\n');
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: add npmignore'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: build tsconfig change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    fs.writeFileSync(
      path.join(cwd, 'libs', 'a', 'tsconfig.lib.json'),
      '{ "compilerOptions": { "outDir": "dist" } }',
    );
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: add tsconfig'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: README-only change is not a candidate', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    fs.appendFileSync(path.join(cwd, 'libs', 'a', 'README.md'), 'Updated.\n');
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'docs: update readme'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      false,
    );
  }));

test('sourceFilesChanged: changelog-only change is not a candidate', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    fs.appendFileSync(
      path.join(cwd, 'libs', 'a', 'CHANGELOG.md'),
      '## 1.0.1\n',
    );
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'docs: update changelog'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      false,
    );
  }));

test('sourceFilesChanged: publishConfig registry migration (GitHub->npmjs) is not a candidate', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.publishConfig = {
      registry: 'https://npm.pkg.github.com/',
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: github registry'], cwd);
    // Migrate to npmjs.
    manifest.publishConfig.registry = 'https://registry.npmjs.org/';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: migrate to npmjs'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~2', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      false,
    );
  }));

test('sourceFilesChanged: publishConfig missing access -> public is not a candidate', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // fixture has no publishConfig — add access: public (npmjs default).
    manifest.publishConfig = { access: 'public' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command(
      'git',
      ['commit', '--quiet', '-m', 'chore: set public access'],
      cwd,
    );
    // Compare baseline (no publishConfig) with HEAD (access:public).
    // access:"public" normalizes to undefined (npmjs default), so both
    // manifests normalize to no publishConfig.
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      false,
    );
  }));

test('sourceFilesChanged: publishConfig public -> restricted is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.publishConfig = { access: 'public' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: public'], cwd);
    manifest.publishConfig.access = 'restricted';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: restricted'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: publishConfig tag change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.publishConfig = { tag: 'next' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: tag next'], cwd);
    manifest.publishConfig.tag = 'latest';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: tag latest'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: publishConfig directory change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.publishConfig = { directory: 'dist' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: directory dist'], cwd);
    manifest.publishConfig.directory = 'lib';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: directory lib'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: publishConfig provenance change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.publishConfig = { provenance: true };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command(
      'git',
      ['commit', '--quiet', '-m', 'chore: enable provenance'],
      cwd,
    );
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: publishConfig unknown field change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.publishConfig = { customField: 'value1' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: custom v1'], cwd);
    manifest.publishConfig.customField = 'value2';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: custom v2'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: version bump and exact revert is not a candidate', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const original = JSON.stringify(manifest, null, 2);
    // Bump
    manifest.version = '2.0.0';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: bump to 2.0.0'], cwd);
    // Revert
    fs.writeFileSync(manifestPath, original);
    command('git', ['add', '.'], cwd);
    command(
      'git',
      ['commit', '--quiet', '-m', 'Revert "chore: bump to 2.0.0"'],
      cwd,
    );
    assert.equal(
      sourceFilesChanged('HEAD~2', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      false,
    );
  }));

test('sourceFilesChanged: peer dependency -> runtime dependency is significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        peerDependencies: { '@mikara89/core': '^2.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      delete manifest.peerDependencies;
      manifest.dependencies = { '@mikara89/core': '^2.0.0' };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: peer->dep'], cwd);
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: runtime dependency -> peer dependency is significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { '@mikara89/core': '^2.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      delete manifest.dependencies;
      manifest.peerDependencies = { '@mikara89/core': '^2.0.0' };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: dep->peer'], cwd);
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: dependency -> optional dependency is significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { leftpad: '^1.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      delete manifest.dependencies;
      manifest.optionalDependencies = { leftpad: '^1.0.0' };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: dep->optional'], cwd);
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: peerDependenciesMeta change is significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        peerDependencies: { react: '^18.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.peerDependenciesMeta = { react: { optional: true } };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: add peerDepsMeta'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: internal dependency range change is significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { '@mikara89/core': '^2.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.dependencies['@mikara89/core'] = '^2.1.0';
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: bump range'], cwd);
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: build devDependency version change is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.devDependencies = { typescript: '^5.0.0' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: pin ts'], cwd);
    // Bump TypeScript in devDeps.
    manifest.devDependencies.typescript = '^5.5.0';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: bump ts'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~2', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: unresolved file: normalization (no declared dep) is significant', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.devDependencies = {
      '@some/tool': 'file:../some-tool',
      typescript: '^5.0.0',
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: add file ref'], cwd);
    delete manifest.devDependencies['@some/tool'];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    command('git', ['add', '.'], cwd);
    command('git', ['commit', '--quiet', '-m', 'chore: remove file ref'], cwd);
    assert.equal(
      sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
      true,
    );
  }));

test('sourceFilesChanged: matching workspace identity/version -> non-candidate', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { '@fixture/core': '^2.0.0' },
      },
      { id: 'core', name: '@fixture/core', version: '2.0.0' },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.devDependencies = {
        '@fixture/core': 'file:../core',
        typescript: '^5.0.0',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add file ref'], cwd);
      delete manifest.devDependencies['@fixture/core'];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: remove file ref'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        false,
      );
    },
  ));

test('sourceFilesChanged: file: target package missing -> significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { '@fixture/missing': '^1.0.0' },
      },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.devDependencies = {
        '@fixture/missing': 'file:../missing',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add file ref'], cwd);
      delete manifest.devDependencies['@fixture/missing'];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: remove file ref'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: file: target name mismatch -> significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { '@fixture/wrong': '^1.0.0' },
      },
      { id: 'core', name: '@fixture/core', version: '1.0.0' },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // Declared as @fixture/wrong but file: points to core (name mismatch)
      manifest.devDependencies = {
        '@fixture/wrong': 'file:../core',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add file ref'], cwd);
      delete manifest.devDependencies['@fixture/wrong'];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: remove file ref'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: file: target version outside declared range -> significant', () =>
  withFixture(
    [
      {
        id: 'a',
        name: '@fixture/a',
        version: '1.0.0',
        dependencies: { '@fixture/core': '^1.0.0' },
      },
      { id: 'core', name: '@fixture/core', version: '2.0.0' },
    ],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.devDependencies = {
        '@fixture/core': 'file:../core',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add file ref'], cwd);
      delete manifest.devDependencies['@fixture/core'];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: remove file ref'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged('HEAD~1', 'HEAD', { relativeDir: 'libs/a' }, cwd),
        true,
      );
    },
  ));

test('sourceFilesChanged: bootstrap manifest/registry version mismatch fails closed', () =>
  withFixture([{ id: 'a', name: '@fixture/a', version: '1.0.0' }], (cwd) => {
    assert.equal(
      sourceFilesChanged(
        'HEAD',
        'HEAD',
        { relativeDir: 'libs/a' },
        cwd,
        '2.0.0', // expected bootstrap version ≠ actual manifest version
      ),
      true,
    );
  }));

test('bootstrap execute step must receive NODE_AUTH_TOKEN; non-bootstrap must not', () => {
  // The bootstrap execute step must forward NODE_AUTH_TOKEN so npm can
  // resolve the ${NODE_AUTH_TOKEN} placeholder in the temporary .npmrc.
  assert.match(
    releaseWorkflow,
    /Execute approved Lerna bootstrap plan[\s\S]*?NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*\}\}/,
  );

  // The non-bootstrap (OIDC) execute step must NOT leak NODE_AUTH_TOKEN.
  const oidcExecuteBlock = releaseWorkflow.match(
    /Execute approved Lerna release plan with npm OIDC[\s\S]*?run:\s*node tools\/release-tool\.js execute/,
  );
  assert.ok(oidcExecuteBlock, 'Expected an OIDC execute step for non-bootstrap releases');
  assert.ok(
    !/NODE_AUTH_TOKEN/.test(oidcExecuteBlock[0]),
    'The OIDC execute step must not include NODE_AUTH_TOKEN',
  );

  // The bootstrap config step must fail closed when the token is absent.
  assert.match(
    releaseWorkflow,
    /Configure temporary npm token for bootstrap[\s\S]*?exit 1/,
  );

  // The bootstrap verify step must fail closed when the token is absent.
  assert.match(
    releaseWorkflow,
    /Verify bootstrap npm authentication[\s\S]*?exit 1/,
  );

  // The validate job must use the same Node version as the publish job.
  const validateNodeVersion = releaseWorkflow.match(
    /jobs:[\s\S]*?validate:[\s\S]*?Setup Node[\s\S]*?node-version:\s*(\S+)/,
  );
  const publishNodeVersion = releaseWorkflow.match(
    /jobs:[\s\S]*?publish:[\s\S]*?Setup Node[\s\S]*?node-version:\s*(\S+)/,
  );
  assert.ok(validateNodeVersion, 'Could not find validate job node-version');
  assert.ok(publishNodeVersion, 'Could not find publish job node-version');
  assert.equal(
    validateNodeVersion[1],
    publishNodeVersion[1],
    `Validate job node-version (${validateNodeVersion[1]}) must match publish job (${publishNodeVersion[1]})`,
  );
});

test('head-anchored bootstrap tags HEAD, normal release selects zero, fix/feat/breaking each select one', () => {
  // — Setup: two packages, a depends on b with a compatible range —
  const cwd = createFixture([
    {
      id: 'a',
      name: '@fixture/a',
      version: '1.0.0',
      dependencies: { '@fixture/b': '^1.0.0' },
    },
    { id: 'b', name: '@fixture/b', version: '1.0.0' },
  ]);

  const head = command('git', ['rev-parse', 'HEAD'], cwd).trim();
  const tagA = packageTag('@fixture/a', '1.0.0');
  const tagB = packageTag('@fixture/b', '1.0.0');

  // Verify initial tags (placed by createFixture) point to HEAD
  assert.equal(
    command('git', ['rev-list', '-n', '1', `${tagA}^{}`], cwd).trim(),
    head,
  );
  assert.equal(
    command('git', ['rev-list', '-n', '1', `${tagB}^{}`], cwd).trim(),
    head,
  );

  // — Immediate normal release: zero candidates —
  const zero = runVersion(cwd, ['--conventional-commits']);
  assert.equal(zero['@fixture/a'].version, '1.0.0');
  assert.equal(zero['@fixture/b'].version, '1.0.0');
  assert.equal(zero['@fixture/a'].dependencies?.['@fixture/b'], '^1.0.0');

  // — Fix commit touching one package: one patch candidate —
  addCommit(cwd, 'a', 'fix: correct behavior');
  const patchPlan = runVersion(cwd, ['--conventional-commits']);
  assert.equal(patchPlan['@fixture/a'].version, '1.0.1');
  assert.equal(patchPlan['@fixture/b'].version, '1.0.0');
  assert.equal(patchPlan['@fixture/a'].dependencies?.['@fixture/b'], '^1.0.0');

  // Undo the fix commit so the feat starts from the same baseline
  command('git', ['reset', '--hard', head], cwd);

  // — Feat commit touching one package: one minor candidate —
  addCommit(cwd, 'b', 'feat: add behavior');
  const minorPlan = runVersion(cwd, ['--conventional-commits']);
  assert.equal(minorPlan['@fixture/a'].version, '1.0.0');
  assert.equal(minorPlan['@fixture/b'].version, '1.1.0');
  assert.equal(minorPlan['@fixture/a'].dependencies?.['@fixture/b'], '^1.0.0');

  // Undo
  command('git', ['reset', '--hard', head], cwd);

  // — Breaking commit touching one package: one major candidate —
  addCommit(cwd, 'a', 'feat!: break contract');
  const majorPlan = runVersion(cwd, ['--conventional-commits']);
  assert.equal(majorPlan['@fixture/a'].version, '2.0.0');
  assert.equal(majorPlan['@fixture/b'].version, '1.0.0');
  // Compatible dependent stays unchanged; dependency range stays compatible
  assert.equal(majorPlan['@fixture/a'].dependencies?.['@fixture/b'], '^1.0.0');
});
