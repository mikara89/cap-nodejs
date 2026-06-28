'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  ReleaseToolError,
  assertCleanTree,
  assertPlanInvariants,
  bootstrapConfirmation,
  buildBootstrapPackages,
  buildReleaseCommand,
  coordinatedMajorConfirmation,
  coordinatedTagCommit,
  createBootstrapTags,
  distTagFor,
  hasReleaseRelevantCommit,
  isReleaseCommit,
  normalizeInputs,
  normalizePackageForBootstrap,
  packageJsonSemanticallyChanged,
  packageTag,
  requiredDependents,
  recoveryCommand,
  sourceFilesChanged,
  validatePlanFile,
} = require('./release-tool');

const rootDir = path.resolve(__dirname, '..');
const lernaCli = path.join(rootDir, 'node_modules', 'lerna', 'dist', 'cli.js');

function command(commandName, args, cwd) {
  const result = spawnSync(commandName, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true', GH_TOKEN: '' },
  });
  if (result.status !== 0) {
    throw new Error(
      `${commandName} ${args.join(' ')} failed (${result.status})\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout;
}

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
    command('git', ['tag', '-a', `${spec.name}@${spec.version}`, '-m', `${spec.name}@${spec.version}`], cwd);
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
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

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
  const workflow = fs.readFileSync(
    path.join(rootDir, '.github', 'workflows', 'release.yml'),
    'utf8',
  );
  for (const input of [
    'operation:',
    'channel:',
    'coordinated_major:',
    'confirmation:',
  ]) {
    assert.match(workflow, new RegExp(`^      ${input}`, 'm'));
  }
  assert.doesNotMatch(
    workflow,
    /release_package|bootstrap_npm|bootstrap_confirmation/,
  );
  assert.equal((workflow.match(/fetch-depth: 0/g) || []).length, 2);
  assert.match(workflow, /environment: npm-production/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(workflow, /if: \$\{\{ inputs\.operation == 'bootstrap' \}\}/);
  assert.match(workflow, /temporary npm tokens are bootstrap-only/);
  assert.match(workflow, /test:release-tooling/);
  assert.match(workflow, /release-tool\.js plan/);
  assert.match(workflow, /release-tool\.js execute/);
  assert.match(workflow, /cancel-in-progress: false/);
  const ci = fs.readFileSync(
    path.join(rootDir, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );
  assert.match(ci, /npm run release:verify/);
  assert.match(ci, /npm run test:release-tooling/);
});

test('sourceFilesChanged returns false when both commits are identical', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      assert.equal(
        sourceFilesChanged(
          'HEAD',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

test('sourceFilesChanged: dependency change is significant', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      // Add a new dependency.
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.dependencies = { leftpad: '^1.0.0' };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add dep'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        true,
      );
    },
  ));

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
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        true,
      );
    },
  ));

test('sourceFilesChanged: exports change is significant', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.exports = { '.': './dist/index.js' };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add exports'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        true,
      );
    },
  ));

test('sourceFilesChanged: files allowlist change is significant', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.files = ['dist', 'README.md'];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add files'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        true,
      );
    },
  ));

test('sourceFilesChanged: .npmignore change is significant', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      fs.writeFileSync(
        path.join(cwd, 'libs', 'a', '.npmignore'),
        'src\n',
      );
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add npmignore'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        true,
      );
    },
  ));

test('sourceFilesChanged: build tsconfig change is significant', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      fs.writeFileSync(
        path.join(cwd, 'libs', 'a', 'tsconfig.lib.json'),
        '{ "compilerOptions": { "outDir": "dist" } }',
      );
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add tsconfig'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        true,
      );
    },
  ));

test('sourceFilesChanged: README-only change is not a candidate', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      fs.appendFileSync(
        path.join(cwd, 'libs', 'a', 'README.md'),
        'Updated.\n',
      );
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'docs: update readme'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

test('sourceFilesChanged: changelog-only change is not a candidate', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      fs.appendFileSync(
        path.join(cwd, 'libs', 'a', 'CHANGELOG.md'),
        '## 1.0.1\n',
      );
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'docs: update changelog'], cwd);
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

test('sourceFilesChanged: registry-only bootstrap normalization is not a candidate', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.publishConfig = {
        registry: 'https://registry.npmjs.org/',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: set publishConfig'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

test('sourceFilesChanged: version bump and exact revert is not a candidate', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
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
        sourceFilesChanged(
          'HEAD~2',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

test('sourceFilesChanged: internal dep moved between sections is not a candidate', () =>
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
      // Move @mikara89/core from peerDependencies to dependencies.
      delete manifest.peerDependencies;
      manifest.dependencies = { '@mikara89/core': '^2.0.0' };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: move internal dep'],
        cwd,
      );
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

test('sourceFilesChanged: devDep file reference removal is not a candidate', () =>
  withFixture(
    [{ id: 'a', name: '@fixture/a', version: '1.0.0' }],
    (cwd) => {
      const manifestPath = path.join(cwd, 'libs', 'a', 'package.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.devDependencies = {
        '@mikara89/core': 'file:../core',
        typescript: '^5.0.0',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      command('git', ['add', '.'], cwd);
      command('git', ['commit', '--quiet', '-m', 'chore: add file ref'], cwd);
      // Now remove the file: reference, keep typescript.
      const manifest2 = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      delete manifest2.devDependencies['@mikara89/core'];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest2, null, 2));
      command('git', ['add', '.'], cwd);
      command(
        'git',
        ['commit', '--quiet', '-m', 'chore: remove file ref'],
        cwd,
      );
      // HEAD~1 has file ref, HEAD has it removed — normalization strips
      // file: refs, so the two manifests normalize to the same thing.
      assert.equal(
        sourceFilesChanged(
          'HEAD~1',
          'HEAD',
          { relativeDir: 'libs/a' },
          cwd,
        ),
        false,
      );
    },
  ));

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
