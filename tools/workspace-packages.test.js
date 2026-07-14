'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  WorkspaceCommandError,
  buildWorkspaceGraph,
  discoverWorkspacePackages,
  listPackages,
  normalizePath,
  packWorkspacePackages,
  readPackageSelection,
  runWorkspaceScript,
  selectWorkspacePackages,
  sortWorkspacePackages,
  validatePackageIdentities,
  validateWorkspacePackages,
} = require('./workspace-packages');
const { discoverPackages, verifyConfiguration } = require('./release-tool');

const rootDir = path.resolve(__dirname, '..');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(specs = [], options = {}) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-workspace-packages-'));
  const workspaces = options.workspaces || ['libs/*'];
  writeJson(path.join(cwd, 'package.json'), {
    name: 'fixture-root',
    private: options.rootPrivate ?? true,
    workspaces,
  });
  writeJson(path.join(cwd, 'lerna.json'), {
    packages: options.lernaPackages || workspaces,
    version: 'independent',
  });
  const lockfile = {
    name: 'fixture-root',
    lockfileVersion: 3,
    packages: { '': { name: 'fixture-root', workspaces } },
  };
  for (const spec of specs) {
    const relativeDir = spec.relativeDir || `libs/${spec.id}`;
    const manifest = {
      name: spec.name || `@fixture/${spec.id}`,
      version: spec.version || '1.0.0',
      ...(spec.private ? { private: true } : {}),
      scripts:
        spec.build === false ? {} : { build: spec.build || 'fixture-build' },
      ...Object.fromEntries(
        [
          'dependencies',
          'optionalDependencies',
          'peerDependencies',
          'devDependencies',
        ]
          .filter((section) => spec[section])
          .map((section) => [section, spec[section]]),
      ),
    };
    writeJson(path.join(cwd, relativeDir, 'package.json'), manifest);
    lockfile.packages[normalizePath(relativeDir)] = {
      name: manifest.name,
      version: manifest.version,
      ...Object.fromEntries(
        [
          'dependencies',
          'optionalDependencies',
          'peerDependencies',
          'devDependencies',
        ]
          .filter((section) => manifest[section])
          .map((section) => [section, manifest[section]]),
      ),
    };
  }
  writeJson(path.join(cwd, 'package-lock.json'), lockfile);
  return cwd;
}

function withFixture(specs, fn, options) {
  const cwd = createFixture(specs, options);
  try {
    return fn(cwd);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 3 });
  }
}

function discoverFixture(cwd) {
  return discoverWorkspacePackages({ cwd, fixture: true });
}

test('discovery finds public packages, sorts by name, and ignores non-manifest directories', () =>
  withFixture(
    [
      { id: 'z', name: '@fixture/z' },
      { id: 'a', name: '@fixture/a' },
      { id: 'private', name: '@fixture/private', private: true },
    ],
    (cwd) => {
      fs.mkdirSync(path.join(cwd, 'libs', 'empty'));
      writeJson(path.join(cwd, 'apps', 'public-app', 'package.json'), {
        name: '@fixture/public-app',
        version: '1.0.0',
      });
      const packages = discoverFixture(cwd);
      assert.deepEqual(
        packages.map((pkg) => pkg.name),
        ['@fixture/a', '@fixture/z'],
      );
      assert.ok(packages.every((pkg) => pkg.relativeDir.startsWith('libs/')));
      assert.ok(packages.every((pkg) => pkg.dir !== cwd));
    },
  ));

test('discovery requires a private root, matching patterns, and the libs/* boundary', () => {
  withFixture(
    [],
    (cwd) => {
      assert.throws(() => discoverFixture(cwd), /private must be true/);
    },
    { rootPrivate: false },
  );
  withFixture(
    [],
    (cwd) => {
      assert.throws(() => discoverFixture(cwd), /must match/);
    },
    { lernaPackages: ['packages/*'] },
  );
  withFixture(
    [],
    (cwd) => {
      assert.throws(() => discoverFixture(cwd), /target only libs\/\*/);
    },
    { workspaces: ['apps/*'] },
  );
});

test('identity validation rejects missing and duplicate names, invalid versions, duplicate directories, and paths outside libs/*', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b' },
    ],
    (cwd) => {
      const [a, b] = discoverFixture(cwd);
      assert.throws(
        () =>
          validatePackageIdentities([{ ...a, name: '' }], {
            cwd,
            fixture: true,
          }),
        /field name/,
      );
      assert.throws(
        () =>
          validatePackageIdentities([a, { ...b, name: a.name }], {
            cwd,
            fixture: true,
          }),
        /conflicts with/,
      );
      assert.throws(
        () =>
          validatePackageIdentities([{ ...a, version: 'nope' }], {
            cwd,
            fixture: true,
          }),
        /invalid version/,
      );
      assert.throws(
        () =>
          validatePackageIdentities([a, { ...a, name: '@fixture/other' }], {
            cwd,
            fixture: true,
          }),
        /normalized directory/,
      );
      assert.throws(
        () =>
          validatePackageIdentities(
            [a, { ...a, name: '@fixture/alias', relativeDir: 'libs/x/../a' }],
            { cwd, fixture: true },
          ),
        /normalized directory libs\/a conflicts with/,
      );
      assert.throws(
        () =>
          validatePackageIdentities(
            [{ ...a, dir: path.join(cwd, 'libs', 'b') }],
            { cwd, fixture: true },
          ),
        /field dir conflicts with normalized relative directory/,
      );
      assert.throws(
        () =>
          validatePackageIdentities(
            [
              {
                ...a,
                dir: cwd,
                relativeDir: '.',
                manifestPath: path.join(cwd, 'package.json'),
              },
            ],
            { cwd, fixture: true },
          ),
        /outside the supported workspace boundary/,
      );
    },
  ));

test('real namespace is enforced unless fixture relaxation is explicit', () =>
  withFixture([{ id: 'a', name: '@fixture/a' }], (cwd) => {
    assert.throws(
      () => discoverWorkspacePackages({ cwd }),
      /expected @mikara89\/cap-/,
    );
    assert.equal(discoverFixture(cwd).length, 1);
  }));

test('path normalization uses forward slashes', () => {
  assert.equal(
    normalizePath('libs\\cap-core\\package.json'),
    'libs/cap-core/package.json',
  );
});

test('graph orders dependency chains and unrelated packages deterministically', () =>
  withFixture(
    [
      { id: 'z', name: '@fixture/z' },
      { id: 'core', name: '@fixture/core' },
      {
        id: 'mid',
        name: '@fixture/mid',
        dependencies: { '@fixture/core': '^1.0.0' },
      },
      {
        id: 'app',
        name: '@fixture/app',
        dependencies: { '@fixture/mid': 'workspace:*' },
      },
    ],
    (cwd) => {
      const packages = discoverFixture(cwd);
      const ordered = sortWorkspacePackages(packages, { cwd });
      assert.deepEqual(
        ordered.map((pkg) => pkg.name),
        ['@fixture/core', '@fixture/mid', '@fixture/app', '@fixture/z'],
      );
      assert.deepEqual(
        ordered.find((pkg) => pkg.name === '@fixture/app').internalDependencies,
        ['@fixture/mid'],
      );
    },
  ));

test('graph identifies optional dependencies and ignores external dependencies', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      {
        id: 'b',
        name: '@fixture/b',
        optionalDependencies: { '@fixture/a': '^1.0.0', external: '^9.0.0' },
      },
    ],
    (cwd) => {
      const packages = discoverFixture(cwd);
      buildWorkspaceGraph(packages, { cwd });
      assert.deepEqual(
        packages.find((pkg) => pkg.name === '@fixture/b').internalDependencies,
        ['@fixture/a'],
      );
    },
  ));

test('graph rejects excluding ranges and unresolved file workspace references', () => {
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b', dependencies: { '@fixture/a': '^2.0.0' } },
    ],
    (cwd) =>
      assert.throws(
        () => buildWorkspaceGraph(discoverFixture(cwd), { cwd }),
        /does not include 1\.0\.0/,
      ),
  );
  withFixture(
    [
      {
        id: 'b',
        name: '@fixture/b',
        dependencies: { '@fixture/missing': 'file:../missing' },
      },
    ],
    (cwd) =>
      assert.throws(
        () => buildWorkspaceGraph(discoverFixture(cwd), { cwd }),
        /missing workspace target/,
      ),
  );
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      {
        id: 'b',
        name: '@fixture/b',
        dependencies: { '@fixture/a': 42 },
      },
    ],
    (cwd) =>
      assert.throws(
        () => buildWorkspaceGraph(discoverFixture(cwd), { cwd }),
        /field dependencies\.@fixture\/a range 42 does not include 1\.0\.0/,
      ),
  );
});

test('graph reports complete two-package and longer cycle paths', () => {
  withFixture(
    [
      { id: 'a', name: '@fixture/a', dependencies: { '@fixture/b': '*' } },
      { id: 'b', name: '@fixture/b', dependencies: { '@fixture/a': '*' } },
    ],
    (cwd) =>
      assert.throws(
        () => buildWorkspaceGraph(discoverFixture(cwd), { cwd }),
        /@fixture\/a -> @fixture\/b -> @fixture\/a/,
      ),
  );
  withFixture(
    [
      { id: 'a', name: '@fixture/a', dependencies: { '@fixture/b': '*' } },
      { id: 'b', name: '@fixture/b', dependencies: { '@fixture/c': '*' } },
      { id: 'c', name: '@fixture/c', dependencies: { '@fixture/a': '*' } },
    ],
    (cwd) =>
      assert.throws(
        () => buildWorkspaceGraph(discoverFixture(cwd), { cwd }),
        /@fixture\/a -> @fixture\/b -> @fixture\/c -> @fixture\/a/,
      ),
  );
});

test('verification checks build scripts, lockfile versions, ranges, and lockfile ranges', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b', dependencies: { '@fixture/a': '^1.0.0' } },
    ],
    (cwd) => {
      assert.equal(
        validateWorkspacePackages({ cwd, fixture: true }).packages.length,
        2,
      );
      const bPath = path.join(cwd, 'libs', 'b', 'package.json');
      const b = JSON.parse(fs.readFileSync(bPath, 'utf8'));
      delete b.scripts.build;
      writeJson(bPath, b);
      assert.throws(
        () => validateWorkspacePackages({ cwd, fixture: true }),
        /scripts\.build/,
      );
    },
  ));

test('verification rejects lockfile version and internal range drift', () => {
  withFixture([{ id: 'a', name: '@fixture/a' }], (cwd) => {
    const lockfilePath = path.join(cwd, 'package-lock.json');
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
    lockfile.packages['libs/a'].version = '2.0.0';
    writeJson(lockfilePath, lockfile);
    assert.throws(
      () => validateWorkspacePackages({ cwd, fixture: true }),
      /package-lock\.json does not match @fixture\/a@1\.0\.0/,
    );
  });
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      {
        id: 'b',
        name: '@fixture/b',
        dependencies: { '@fixture/a': '^1.0.0' },
      },
    ],
    (cwd) => {
      const lockfilePath = path.join(cwd, 'package-lock.json');
      const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
      lockfile.packages['libs/b'].dependencies['@fixture/a'] = '~1.0.0';
      writeJson(lockfilePath, lockfile);
      assert.throws(
        () => validateWorkspacePackages({ cwd, fixture: true }),
        /range for @fixture\/b -> @fixture\/a does not match \^1\.0\.0/,
      );
    },
  );
});

test('build orchestration runs each public package once in dependency order', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b', dependencies: { '@fixture/a': '*' } },
    ],
    (cwd) => {
      const calls = [];
      const packages = discoverFixture(cwd);
      runWorkspaceScript({
        cwd,
        packages,
        fixture: true,
        script: 'build',
        env: { WORKSPACE_TEST_MARKER: 'preserved' },
        runner(command, args, options) {
          assert.equal(options.env.WORKSPACE_TEST_MARKER, 'preserved');
          assert.equal(options.env.PATH, process.env.PATH);
          calls.push({ command, args, package: options.package.name });
          return { status: 0 };
        },
      });
      assert.deepEqual(
        calls.map((call) => call.package),
        ['@fixture/a', '@fixture/b'],
      );
      assert.ok(
        calls.every(
          (call) =>
            call.args.includes('--workspace') &&
            (/^npm(?:\.cmd)?$/.test(call.command) ||
              call.command === process.execPath ||
              /cmd(?:\.exe)?$/i.test(call.command)),
        ),
      );
    },
  ));

test('build orchestration rejects missing scripts and stops on first failure with child status', () => {
  withFixture([{ id: 'a', name: '@fixture/a', build: false }], (cwd) => {
    assert.throws(
      () =>
        runWorkspaceScript({
          cwd,
          packages: discoverFixture(cwd),
          fixture: true,
          script: 'build',
          runner: () => ({ status: 0 }),
        }),
      /scripts\.build/,
    );
  });
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b' },
    ],
    (cwd) => {
      const calls = [];
      assert.throws(
        () =>
          runWorkspaceScript({
            cwd,
            packages: discoverFixture(cwd),
            fixture: true,
            script: 'build',
            runner(command, args, options) {
              calls.push(options.package.name);
              return { status: 7 };
            },
          }),
        (error) =>
          error instanceof WorkspaceCommandError &&
          error.exitCode === 7 &&
          /@fixture\/a/.test(error.message),
      );
      assert.deepEqual(calls, ['@fixture/a']);
    },
  );
});

test('pack dry-run includes every public package once, creates no tarball, and reports failures', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b' },
      { id: 'p', name: '@fixture/p', private: true },
    ],
    (cwd) => {
      const calls = [];
      packWorkspacePackages({
        cwd,
        packages: discoverFixture(cwd),
        fixture: true,
        dryRun: true,
        runner(command, args, options) {
          calls.push({ args, name: options.package.name });
          return { status: 0 };
        },
      });
      assert.deepEqual(
        calls.map((call) => call.name),
        ['@fixture/a', '@fixture/b'],
      );
      assert.ok(calls.every((call) => call.args.includes('--dry-run')));
      assert.ok(calls.every((call) => !call.args.includes('--ignore-scripts')));
      assert.deepEqual(
        fs.readdirSync(cwd).filter((name) => name.endsWith('.tgz')),
        [],
      );
      assert.throws(
        () =>
          packWorkspacePackages({
            cwd,
            packages: discoverFixture(cwd),
            fixture: true,
            dryRun: true,
            runner(command, args, options) {
              return { status: options.package.name === '@fixture/a' ? 3 : 0 };
            },
          }),
        /@fixture\/a.*failed with exit 3/,
      );
    },
  ));

test('selected package execution reads plan fields and preserves dependency-first order', () =>
  withFixture(
    [
      { id: 'a', name: '@fixture/a' },
      { id: 'b', name: '@fixture/b', dependencies: { '@fixture/a': '*' } },
      { id: 'c', name: '@fixture/c' },
    ],
    (cwd) => {
      const validation = validateWorkspacePackages({ cwd, fixture: true });
      assert.deepEqual(
        selectWorkspacePackages(validation, ['@fixture/b', '@fixture/a']).map(
          (pkg) => pkg.name,
        ),
        ['@fixture/a', '@fixture/b'],
      );
      assert.throws(
        () => selectWorkspacePackages(validation, ['@fixture/missing']),
        /Unknown publishable workspace package/,
      );
      const planPath = path.join(cwd, 'affected-plan.json');
      writeJson(planPath, {
        buildPackages: ['@fixture/b', '@fixture/a'],
        packPackages: ['@fixture/c'],
      });
      assert.deepEqual(readPackageSelection(planPath, 'buildPackages'), [
        '@fixture/b',
        '@fixture/a',
      ]);
      const built = [];
      runWorkspaceScript({
        cwd,
        fixture: true,
        script: 'build',
        packageNames: readPackageSelection(planPath, 'buildPackages'),
        runner(command, args, options) {
          built.push(options.package.name);
          return { status: 0 };
        },
      });
      assert.deepEqual(built, ['@fixture/a', '@fixture/b']);
      const packed = [];
      packWorkspacePackages({
        cwd,
        fixture: true,
        dryRun: true,
        ignoreScripts: true,
        packageNames: readPackageSelection(planPath, 'packPackages'),
        runner(command, args, options) {
          packed.push({ args, name: options.package.name });
          return { status: 0 };
        },
      });
      assert.deepEqual(
        packed.map(({ name }) => name),
        ['@fixture/c'],
      );
      assert.ok(packed[0].args.includes('--ignore-scripts'));
    },
  ));

test('adding a fixture package automatically affects discovery, build, pack, JSON, and release discovery', () =>
  withFixture([{ id: 'a', name: '@fixture/a' }], (cwd) => {
    const added = {
      name: '@fixture/new',
      version: '1.0.0',
      scripts: { build: 'fixture-build' },
    };
    writeJson(path.join(cwd, 'libs', 'new', 'package.json'), added);
    const lockfilePath = path.join(cwd, 'package-lock.json');
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
    lockfile.packages['libs/new'] = {
      name: added.name,
      version: added.version,
    };
    writeJson(lockfilePath, lockfile);
    const packages = discoverFixture(cwd);
    const built = [];
    const packed = [];
    runWorkspaceScript({
      cwd,
      packages,
      fixture: true,
      script: 'build',
      runner(command, args, options) {
        built.push(options.package.name);
        return { status: 0 };
      },
    });
    packWorkspacePackages({
      cwd,
      packages,
      fixture: true,
      dryRun: true,
      runner(command, args, options) {
        packed.push(options.package.name);
        return { status: 0 };
      },
    });
    const json = JSON.parse(listPackages({ cwd, fixture: true, json: true }));
    assert.ok(packages.some((pkg) => pkg.name === '@fixture/new'));
    assert.ok(built.includes('@fixture/new'));
    assert.ok(packed.includes('@fixture/new'));
    assert.ok(
      json.some((pkg) => pkg.name === '@fixture/new' && pkg.hasBuildScript),
    );
    assert.ok(
      discoverPackages(cwd, { fixture: true }).some(
        (pkg) => pkg.name === '@fixture/new',
      ),
    );
  }));

test('release verification receives the shared real package set and aggregate scripts contain no package enumeration', () => {
  const shared = discoverWorkspacePackages({ cwd: rootDir });
  const release = verifyConfiguration(rootDir).packages;
  const independentlyEnumerated = fs
    .readdirSync(path.join(rootDir, 'libs'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifestPath = path.join(
        rootDir,
        'libs',
        entry.name,
        'package.json',
      );
      if (!fs.existsSync(manifestPath)) return [];
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return manifest.private === true ? [] : [`libs/${entry.name}`];
    })
    .sort();
  assert.ok(shared.length > 0);
  assert.deepEqual(
    shared.map((pkg) => pkg.relativeDir).sort(),
    independentlyEnumerated,
  );
  assert.deepEqual(
    release.map((pkg) => pkg.name),
    shared.map((pkg) => pkg.name),
  );
  assert.ok(
    shared.every((pkg) => typeof pkg.manifest.scripts?.build === 'string'),
  );
  const rootManifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
  );
  assert.equal(
    rootManifest.scripts['build:libs'],
    'node tools/workspace-packages.js run --script build',
  );
  assert.equal(
    rootManifest.scripts['pack:dry-run'],
    'node tools/workspace-packages.js pack --dry-run',
  );
  assert.doesNotMatch(rootManifest.scripts['build:libs'], /@mikara89\/cap-/);
  assert.doesNotMatch(rootManifest.scripts['pack:dry-run'], /@mikara89\/cap-/);
  const releaseSource = fs.readFileSync(
    path.join(rootDir, 'tools', 'release-tool.js'),
    'utf8',
  );
  assert.doesNotMatch(releaseSource, /readdirSync/);
});

test('release verification keeps explicit relaxed namespace fixture support', () =>
  withFixture([{ id: 'a', name: '@fixture/a' }], (cwd) => {
    writeJson(
      path.join(cwd, 'lerna.json'),
      JSON.parse(fs.readFileSync(path.join(rootDir, 'lerna.json'), 'utf8')),
    );
    fs.mkdirSync(path.join(cwd, 'tools'), { recursive: true });
    fs.copyFileSync(
      path.join(rootDir, 'tools', 'package-owned-changelog-preset.js'),
      path.join(cwd, 'tools', 'package-owned-changelog-preset.js'),
    );
    const result = verifyConfiguration(cwd, {
      fixture: true,
      dependencyRoot: rootDir,
    });
    assert.deepEqual(
      result.packages.map((pkg) => pkg.name),
      ['@fixture/a'],
    );
  }));

test('CLI help succeeds while unknown commands and missing required arguments fail concisely', () => {
  const cli = path.join(rootDir, 'tools', 'workspace-packages.js');
  const help = spawnSync(process.execPath, [cli, '--help'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /list \[--json\]/);
  const unknown = spawnSync(process.execPath, [cli, 'unknown'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown command: unknown/);
  assert.doesNotMatch(unknown.stderr, /WorkspacePackageError:/);
  const missing = spawnSync(process.execPath, [cli, 'run'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /run requires --script/);
});
