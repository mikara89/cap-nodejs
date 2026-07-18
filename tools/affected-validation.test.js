'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  AffectedCommandError,
  AffectedValidationError,
  commandKinds,
  createCommandInvocation,
  createAffectedPlan,
  createPlanFromChangedFiles,
  formatPlanSummary,
  main,
  resolveCommandInvocation,
  resolveCommit,
  runAffectedValidation,
} = require('./affected-validation');
const { validateWorkspacePackages } = require('./workspace-packages');

const repositoryRoot = path.resolve(__dirname, '..');
const names = {
  core: '@mikara89/cap-core',
  nest: '@mikara89/cap-nest',
  dashboardNest: '@mikara89/cap-dashboard-nest',
  testing: '@mikara89/cap-testing',
  independent: '@fixture/independent',
  storage: '@mikara89/cap-storage-prisma',
  rabbitmq: '@mikara89/cap-transport-rabbitmq',
  kafka: '@mikara89/cap-transport-kafka',
  aws: '@mikara89/cap-transport-aws-sns-sqs',
  dashboardCore: '@mikara89/cap-dashboard-core',
};

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function git(cwd, args, options = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  });
  if (result.status !== 0)
    throw new Error(`git ${args.join(' ')} failed\n${result.stderr || ''}`);
  return result.stdout.trim();
}

function createFixture() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-affected-test-'));
  const specs = [
    { id: 'core', name: names.core },
    { id: 'nest', name: names.nest, dependencies: { [names.core]: '^1.0.0' } },
    {
      id: 'dashboard-nest',
      name: names.dashboardNest,
      dependencies: { [names.nest]: '^1.0.0' },
    },
    {
      id: 'testing',
      name: names.testing,
      dependencies: { [names.core]: '^1.0.0' },
    },
    { id: 'independent', name: names.independent },
    {
      id: 'storage-prisma',
      name: names.storage,
      dependencies: { [names.core]: '^1.0.0' },
    },
    {
      id: 'transport-rabbitmq',
      name: names.rabbitmq,
      dependencies: { [names.core]: '^1.0.0' },
    },
    {
      id: 'transport-kafka',
      name: names.kafka,
      dependencies: { [names.core]: '^1.0.0' },
    },
    {
      id: 'transport-aws-sns-sqs',
      name: names.aws,
      dependencies: { [names.core]: '^1.0.0' },
    },
    {
      id: 'dashboard-core',
      name: names.dashboardCore,
      dependencies: { [names.core]: '^1.0.0' },
    },
  ];
  const rootManifest = {
    name: 'fixture',
    private: true,
    version: '1.0.0',
    workspaces: ['libs/*'],
  };
  writeJson(path.join(cwd, 'package.json'), rootManifest);
  writeJson(path.join(cwd, 'lerna.json'), {
    packages: ['libs/*'],
    version: 'independent',
  });
  const lockfile = {
    name: 'fixture',
    version: '1.0.0',
    lockfileVersion: 3,
    requires: true,
    packages: { '': rootManifest },
  };
  for (const spec of specs) {
    const relativeDir = `libs/${spec.id}`;
    const manifest = {
      name: spec.name,
      version: '1.0.0',
      scripts: { build: 'node -e "process.exit(0)"' },
      ...(spec.dependencies ? { dependencies: spec.dependencies } : {}),
    };
    writeJson(path.join(cwd, relativeDir, 'package.json'), manifest);
    fs.mkdirSync(path.join(cwd, relativeDir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, relativeDir, 'src', 'index.ts'),
      'export {};\n',
    );
    fs.writeFileSync(
      path.join(cwd, relativeDir, 'src', 'unit.spec.ts'),
      "describe('unit', () => it('passes', () => expect(true).toBe(true)));\n",
    );
    if (spec.id === 'independent') {
      fs.writeFileSync(
        path.join(cwd, relativeDir, 'src', 'unit.test.ts'),
        "describe('test suffix', () => it('passes', () => expect(true).toBe(true)));\n",
      );
    }
    if (spec.id === 'nest') {
      fs.writeFileSync(
        path.join(cwd, relativeDir, 'src', 'cap.init.integration.spec.ts'),
        "describe('local integration', () => it('passes', () => expect(true).toBe(true)));\n",
      );
    }
    if (spec.id === 'transport-rabbitmq') {
      fs.mkdirSync(path.join(cwd, relativeDir, 'test'), { recursive: true });
      fs.writeFileSync(
        path.join(cwd, relativeDir, 'test', 'rabbitmq.integration.spec.ts'),
        "describe('broker', () => it('is external', () => expect(true).toBe(true)));\n",
      );
    }
    fs.writeFileSync(path.join(cwd, relativeDir, 'README.md'), '# fixture\n');
    lockfile.packages[relativeDir] = manifest;
  }
  writeJson(path.join(cwd, 'package-lock.json'), lockfile);
  fs.mkdirSync(path.join(cwd, 'apps', 'cap-test-app', 'src'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(cwd, 'apps', 'cap-test-app', 'src', 'main.ts'),
    "import '@mikara89/cap-nest';\nimport '@mikara89/cap-storage-prisma/nest';\n",
  );
  fs.mkdirSync(path.join(cwd, 'examples'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'examples', 'example.ts'), 'export {};\n');
  git(cwd, ['init', '--quiet', '--initial-branch=main']);
  git(cwd, ['config', 'user.email', 'fixture@example.com']);
  git(cwd, ['config', 'user.name', 'Fixture']);
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '--quiet', '-m', 'initial']);
  const validation = validateWorkspacePackages({ cwd, fixture: true });
  return {
    cwd,
    validation,
    cleanup() {
      fs.rmSync(cwd, { recursive: true, force: true });
    },
  };
}

function syntheticPlan(fixture, changedFiles) {
  return createPlanFromChangedFiles({
    cwd: fixture.cwd,
    validation: fixture.validation,
    changedFiles,
    baseSha: 'base',
    headSha: 'head',
    comparisonBaseSha: 'merge-base',
    comparisonRange: 'merge-base..head',
  });
}

function captureRunner(options = {}) {
  const calls = [];
  const runner = (invocation) => {
    calls.push({
      ...invocation,
      args: [...invocation.args],
      env: { ...invocation.env },
      options: invocation,
    });
    if (
      options.startupErrorGate &&
      invocation.gate === options.startupErrorGate
    )
      return {
        status: null,
        error: new Error(options.startupErrorMessage || 'could not start'),
      };
    if (options.failGate && invocation.gate === options.failGate)
      return { status: options.exitCode || 7, stdout: '', stderr: 'failed' };
    return { status: 0, stdout: '', stderr: '' };
  };
  return { calls, runner };
}

function joinedCalls(calls) {
  return calls.map((call) => call.args.join(' ')).join('\n');
}

test('command invocation resolves only repository-approved executables', async (t) => {
  await t.test('1 Git kind resolves to Git and keeps refs as arguments', () => {
    const invocation = resolveCommandInvocation(commandKinds.git, [
      'rev-parse',
      '--verify',
      'feature^{commit}',
    ]);
    assert.equal(invocation.command, 'git');
    assert.deepEqual(invocation.args, [
      'rev-parse',
      '--verify',
      'feature^{commit}',
    ]);
  });

  await t.test(
    '2 npm kind preserves the repository npm resolver result',
    () => {
      const npmCli = path.join(repositoryRoot, 'node_modules', 'npm-cli.js');
      const invocation = resolveCommandInvocation(
        commandKinds.npm,
        ['run', 'lint:check'],
        {
          npmResolver: (args) => ({
            command: process.execPath,
            args: [npmCli, ...args],
          }),
        },
      );
      assert.equal(invocation.command, process.execPath);
      assert.deepEqual(invocation.args, [npmCli, 'run', 'lint:check']);
    },
  );

  await t.test('3 POSIX npm fallback is the fixed npm executable', () => {
    const invocation = resolveCommandInvocation(commandKinds.npm, ['test'], {
      platform: 'linux',
      npmResolver: (args) => ({ command: 'npm', args }),
    });
    assert.deepEqual(invocation, { command: 'npm', args: ['test'] });
  });

  await t.test('4 Windows command-processor fallbacks are rejected', () => {
    assert.throws(
      () =>
        resolveCommandInvocation(commandKinds.npm, ['run', 'build'], {
          platform: 'win32',
          npmResolver: (args) => ({
            command: 'cmd.exe',
            args: ['/d', '/s', '/c', 'npm.cmd', ...args],
          }),
        }),
      /Unsupported npm executable resolution: cmd\.exe/u,
    );
  });

  await t.test(
    '5 Node kind resolves only to the current Node executable',
    () => {
      const absoluteTest = path.resolve('libs/core/src/example.spec.ts');
      const invocation = resolveCommandInvocation(commandKinds.node, [
        absoluteTest,
      ]);
      assert.equal(invocation.command, process.execPath);
      assert.deepEqual(invocation.args, [absoluteTest]);
      assert.notEqual(invocation.command, absoluteTest);
    },
  );

  await t.test('6 unknown kinds and non-array arguments are rejected', () => {
    assert.throws(
      () => resolveCommandInvocation('custom', ['tool.js']),
      (error) =>
        error instanceof AffectedValidationError &&
        /Unsupported command kind: custom/u.test(error.message),
    );
    assert.throws(
      () => resolveCommandInvocation(commandKinds.git, 'status'),
      /must be an array/u,
    );
  });

  await t.test('7 unexpected npm executables are rejected', () => {
    assert.throws(
      () =>
        resolveCommandInvocation(commandKinds.npm, ['test'], {
          platform: 'linux',
          npmResolver: (args) => ({ command: '/tmp/npm', args }),
        }),
      /Unsupported npm executable resolution/u,
    );
  });

  await t.test(
    '8 invocation records forward environment and explicitly disable shells',
    () => {
      const invocation = createCommandInvocation(
        commandKinds.node,
        ['tool.js'],
        {
          cwd: repositoryRoot,
          env: {
            CAP_COMMAND_TEST: 'forwarded',
            PATH: 'C:\\not-an-executable-selection',
          },
          encoding: 'utf8',
          gate: 'command record',
        },
      );
      assert.equal(invocation.command, process.execPath);
      assert.equal(invocation.env.CAP_COMMAND_TEST, 'forwarded');
      assert.equal(invocation.shell, false);
      assert.equal(invocation.stdio, 'pipe');
      assert.equal(invocation.gate, 'command record');
    },
  );

  await t.test(
    '9 Git output capture retains deterministic invocation data',
    () => {
      let captured;
      const sha = resolveCommit('topic/ref', {
        cwd: repositoryRoot,
        gitRunner: (invocation) => {
          captured = invocation;
          return { status: 0, stdout: 'abc123\n', stderr: '' };
        },
      });
      assert.equal(sha, 'abc123');
      assert.equal(captured.kind, commandKinds.git);
      assert.equal(captured.command, 'git');
      assert.deepEqual(captured.args, [
        'rev-parse',
        '--verify',
        'topic/ref^{commit}',
      ]);
      assert.equal(captured.encoding, 'utf8');
      assert.equal(captured.stdio, 'pipe');
      assert.equal(captured.shell, false);
    },
  );
});

test('changed-file mapping and Git comparison are deterministic', async (t) => {
  const fixture = createFixture();
  try {
    await t.test('1 maps a package source file to its package', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/index.ts']);
      assert.deepEqual(plan.directlyAffectedPackages, [names.core]);
    });
    await t.test('2 maps several package changes', () => {
      const plan = syntheticPlan(fixture, [
        'libs/independent/src/index.ts',
        'libs/core/src/index.ts',
      ]);
      assert.ok(plan.directlyAffectedPackages.includes(names.core));
      assert.ok(plan.directlyAffectedPackages.includes(names.independent));
    });
    await t.test('3 ignores a package README for runtime tests', () => {
      const plan = syntheticPlan(fixture, ['libs/core/README.md']);
      assert.deepEqual(plan.testPackages, []);
      assert.equal(plan.gates.unitTests, false);
    });
    await t.test('4 includes a package README for pack impact', () => {
      const plan = syntheticPlan(fixture, ['libs/core/README.md']);
      assert.deepEqual(plan.packPackages, [names.core]);
    });
    await t.test('5 maps apps and examples separately', () => {
      const plan = syntheticPlan(fixture, [
        'apps/cap-test-app/src/main.ts',
        'examples/example.ts',
      ]);
      assert.equal(plan.gates.e2e, true);
      assert.equal(plan.gates.examples, true);
      assert.deepEqual(plan.directlyAffectedPackages, []);
    });
    await t.test('6 normalizes Windows paths', () => {
      const plan = syntheticPlan(fixture, ['libs\\core\\src\\index.ts']);
      assert.deepEqual(plan.changedFiles, ['libs/core/src/index.ts']);
    });
    await t.test('7 rejects a missing base commit', () => {
      assert.throws(
        () =>
          createAffectedPlan({
            cwd: fixture.cwd,
            validation: fixture.validation,
            base: 'missing-base',
            head: 'HEAD',
          }),
        /does not exist/,
      );
    });
    await t.test('8 rejects a missing head commit', () => {
      assert.throws(
        () =>
          createAffectedPlan({
            cwd: fixture.cwd,
            validation: fixture.validation,
            base: 'HEAD',
            head: 'missing-head',
          }),
        /does not exist/,
      );
    });
    await t.test('9 uses the correct merge base', () => {
      const original = git(fixture.cwd, ['rev-parse', 'HEAD']);
      git(fixture.cwd, ['checkout', '--quiet', '-b', 'feature']);
      fs.writeFileSync(
        path.join(fixture.cwd, 'libs', 'core', 'src', 'feature.ts'),
        'export {};\n',
      );
      git(fixture.cwd, ['add', '.']);
      git(fixture.cwd, ['commit', '--quiet', '-m', 'feature']);
      const feature = git(fixture.cwd, ['rev-parse', 'HEAD']);
      git(fixture.cwd, ['checkout', '--quiet', 'main']);
      fs.writeFileSync(path.join(fixture.cwd, 'ADMIN.txt'), 'main advanced\n');
      git(fixture.cwd, ['add', '.']);
      git(fixture.cwd, ['commit', '--quiet', '-m', 'main advance']);
      const advancedMain = git(fixture.cwd, ['rev-parse', 'HEAD']);
      const plan = createAffectedPlan({
        cwd: fixture.cwd,
        validation: fixture.validation,
        base: advancedMain,
        head: feature,
      });
      assert.equal(plan.comparisonBaseSha, original);
      assert.deepEqual(plan.changedFiles, ['libs/core/src/feature.ts']);
    });
  } finally {
    fixture.cleanup();
  }
});

test('dependent expansion follows CI compatibility impact', async (t) => {
  const fixture = createFixture();
  try {
    await t.test('10 core source includes direct dependents', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/service.ts']);
      assert.ok(plan.affectedDependents.includes(names.nest));
    });
    await t.test('11 core source includes transitive dependents', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/service.ts']);
      assert.ok(plan.affectedDependents.includes(names.dashboardNest));
    });
    await t.test(
      '12 package test-only change does not expand dependents',
      () => {
        const plan = syntheticPlan(fixture, ['libs/core/src/unit.spec.ts']);
        assert.deepEqual(plan.affectedDependents, []);
      },
    );
    await t.test(
      '13 package documentation-only change does not expand dependents',
      () => {
        const plan = syntheticPlan(fixture, ['libs/core/README.md']);
        assert.deepEqual(plan.affectedDependents, []);
      },
    );
    await t.test('14 export change expands dependents', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/index.ts']);
      assert.ok(plan.affectedDependents.includes(names.nest));
    });
    await t.test('15 runtime dependency change expands dependents', () => {
      const plan = syntheticPlan(fixture, ['libs/core/package.json']);
      assert.ok(plan.affectedDependents.includes(names.nest));
    });
    await t.test('16 build tsconfig expands dependents', () => {
      const plan = syntheticPlan(fixture, ['libs/core/tsconfig.lib.json']);
      assert.ok(plan.affectedDependents.includes(names.nest));
    });
    await t.test('17 test tsconfig does not expand runtime dependents', () => {
      const plan = syntheticPlan(fixture, ['libs/core/tsconfig.test.json']);
      assert.deepEqual(plan.affectedDependents, []);
    });
    await t.test('18 independent packages remain excluded', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/service.ts']);
      assert.ok(!plan.affectedPackages.includes(names.independent));
    });
    await t.test(
      'root-Jest selection keeps local integration specs but excludes broker integration',
      () => {
        const plan = syntheticPlan(fixture, ['libs/core/src/service.ts']);
        assert.ok(
          plan.testFiles.includes('libs/nest/src/cap.init.integration.spec.ts'),
        );
        assert.ok(
          !plan.testFiles.includes(
            'libs/transport-rabbitmq/test/rabbitmq.integration.spec.ts',
          ),
        );
        const independent = syntheticPlan(fixture, [
          'libs/independent/src/index.ts',
        ]);
        assert.ok(
          independent.testFiles.includes('libs/independent/src/unit.test.ts'),
        );
      },
    );
  } finally {
    fixture.cleanup();
  }
});

test('repository-global and policy-only classifications are explicit', async (t) => {
  const fixture = createFixture();
  try {
    for (const [number, file] of [
      [19, 'package.json'],
      [20, 'package-lock.json'],
      [21, 'tsconfig.json'],
      [24, 'tools/workspace-packages.js'],
    ]) {
      await t.test(
        `${number} ${file} triggers global package validation`,
        () => {
          const plan = syntheticPlan(fixture, [file]);
          assert.equal(plan.globalImpact, true);
          assert.equal(
            plan.buildPackages.length,
            fixture.validation.packages.length,
          );
        },
      );
    }
    await t.test(
      '22 ESLint config triggers full lint without global runtime work',
      () => {
        const plan = syntheticPlan(fixture, ['eslint.config.mjs']);
        assert.equal(plan.gates.lint, true);
        assert.equal(plan.globalImpact, false);
        assert.deepEqual(plan.buildPackages, []);
      },
    );
    await t.test('23 Jest config triggers full unit tests', () => {
      const plan = syntheticPlan(fixture, ['jest.config.js']);
      assert.equal(plan.gates.fullUnitTests, true);
      assert.equal(plan.globalImpact, false);
    });
    await t.test(
      '25 release-tool-only does not run database integration',
      () => {
        const plan = syntheticPlan(fixture, ['tools/release-tool.js']);
        assert.equal(plan.gates.releaseToolTests, true);
        assert.equal(plan.gates.databaseIntegration, false);
      },
    );
    await t.test(
      '26 CI workflow-only runs workflow and release safety tests',
      () => {
        const plan = syntheticPlan(fixture, ['.github/workflows/ci.yml']);
        assert.equal(plan.gates.affectedToolTests, true);
        assert.equal(plan.gates.releaseVerify, true);
        assert.equal(plan.gates.releaseToolTests, true);
      },
    );
    await t.test(
      '27 documentation-only avoids global runtime validation',
      () => {
        const plan = syntheticPlan(fixture, ['docs/validation.md']);
        assert.equal(plan.globalImpact, false);
        assert.deepEqual(plan.buildPackages, []);
        assert.equal(plan.gates.databaseIntegration, false);
      },
    );
  } finally {
    fixture.cleanup();
  }
});

test('conditional integration, documentation, and package gates are targeted', async (t) => {
  const fixture = createFixture();
  try {
    const cases = [
      [
        28,
        'storage runtime',
        'libs/storage-prisma/src/storage.ts',
        'databaseIntegration',
      ],
      [
        30,
        'DB integration test',
        'libs/storage-prisma/test/outbox-claim.sql.integration-spec.ts',
        'databaseIntegration',
      ],
      [31, 'application', 'apps/cap-test-app/src/main.ts', 'e2e'],
      [32, 'public core API', 'libs/core/src/index.ts', 'examples'],
      [
        34,
        'RabbitMQ',
        'libs/transport-rabbitmq/src/index.ts',
        'rabbitmqPackSmoke',
      ],
      [35, 'Kafka', 'libs/transport-kafka/src/index.ts', 'kafkaPackSmoke'],
      [36, 'AWS', 'libs/transport-aws-sns-sqs/src/index.ts', 'awsPackSmoke'],
      [
        37,
        'storage Nest export',
        'libs/storage-prisma/src/nest/index.ts',
        'storageNestPackSmoke',
      ],
      [
        38,
        'dashboard/core compatibility',
        'libs/dashboard-core/src/index.ts',
        'dashboardIsolationSmoke',
      ],
    ];
    for (const [number, label, file, gate] of cases) {
      await t.test(`${number} ${label} enables ${gate}`, () => {
        const plan = syntheticPlan(fixture, [file]);
        assert.equal(plan.gates[gate], true);
        if (number === 28) assert.equal(plan.gates.apiDocs, true);
        if (number === 32) assert.equal(plan.gates.apiDocs, true);
        if (number === 37) {
          assert.equal(plan.gates.examples, true);
          assert.equal(plan.gates.apiDocs, true);
        }
      });
    }
    await t.test(
      '29 storage spec-only does not require database integration',
      () => {
        const plan = syntheticPlan(fixture, [
          'libs/storage-prisma/src/storage.spec.ts',
        ]);
        assert.equal(plan.gates.databaseIntegration, false);
      },
    );
    await t.test(
      'Prisma package client configuration enables database integration',
      () => {
        const plan = syntheticPlan(fixture, [
          'libs/storage-prisma/package.json',
        ]);
        assert.equal(plan.gates.databaseIntegration, true);
      },
    );
    await t.test(
      'selected unit tests build the shared testing workspace first',
      () => {
        const plan = syntheticPlan(fixture, [
          'libs/transport-aws-sns-sqs/src/unit.spec.ts',
        ]);
        assert.ok(plan.buildPackages.includes(names.testing));
        assert.ok(
          plan.buildPackages.indexOf(names.testing) <
            plan.buildPackages.indexOf(names.aws),
        );
      },
    );
    await t.test(
      'e2e builds workspace packages imported by the test application',
      () => {
        const plan = syntheticPlan(fixture, [
          'libs/transport-aws-sns-sqs/src/index.ts',
        ]);
        assert.ok(plan.buildPackages.includes(names.nest));
        assert.ok(plan.buildPackages.includes(names.storage));
      },
    );
    await t.test('33 README-only enables selected package dry-run', () => {
      const plan = syntheticPlan(fixture, ['libs/core/README.md']);
      assert.equal(plan.gates.packageDryRun, true);
      assert.deepEqual(plan.packPackages, [names.core]);
    });
    await t.test('39 generic pack tooling enables every pack smoke', () => {
      const plan = syntheticPlan(fixture, ['tools/workspace-packages.js']);
      for (const gate of [
        'rabbitmqPackSmoke',
        'kafkaPackSmoke',
        'awsPackSmoke',
        'storageNestPackSmoke',
        'dashboardIsolationSmoke',
      ])
        assert.equal(plan.gates[gate], true, gate);
    });
  } finally {
    fixture.cleanup();
  }
});

test('zero-package plans and serialized plans remain deterministic', async (t) => {
  const fixture = createFixture();
  try {
    await t.test(
      '40 root documentation-only returns a valid zero-package plan',
      () => {
        const plan = syntheticPlan(fixture, ['CONTRIBUTING.md']);
        assert.deepEqual(plan.affectedPackages, []);
        assert.equal(plan.gates.packageVerify, true);
      },
    );
    await t.test(
      '41 workflow-only returns no runtime packages but CI tests',
      () => {
        const plan = syntheticPlan(fixture, ['.github/workflows/ci.yml']);
        assert.deepEqual(plan.buildPackages, []);
        assert.equal(plan.gates.affectedToolTests, true);
      },
    );
    await t.test('42 empty diff is a documented valid no-op plan', () => {
      const plan = syntheticPlan(fixture, []);
      assert.deepEqual(plan.affectedPackages, []);
      assert.match(plan.reasons[0], /No changed files/);
    });
    await t.test('43 package ordering is dependency-first', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/index.ts']);
      assert.ok(
        plan.buildPackages.indexOf(names.nest) <
          plan.buildPackages.indexOf(names.dashboardNest),
      );
    });
    await t.test('44 changed-file ordering does not alter the plan', () => {
      const left = syntheticPlan(fixture, [
        'libs/core/src/index.ts',
        'libs/independent/src/index.ts',
      ]);
      const right = syntheticPlan(fixture, [
        'libs/independent/src/index.ts',
        'libs/core/src/index.ts',
      ]);
      assert.deepEqual(left, right);
    });
    await t.test('45 duplicate changed paths do not duplicate packages', () => {
      const plan = syntheticPlan(fixture, [
        'libs/core/src/index.ts',
        'libs/core/src/index.ts',
      ]);
      assert.equal(plan.directlyAffectedPackages.length, 1);
    });
    await t.test(
      '46 JSON is stable across Windows and Linux path styles',
      () => {
        const windows = syntheticPlan(fixture, ['libs\\core\\src\\index.ts']);
        const linux = syntheticPlan(fixture, ['libs/core/src/index.ts']);
        assert.equal(JSON.stringify(windows), JSON.stringify(linux));
      },
    );
  } finally {
    fixture.cleanup();
  }
});

test('affected execution uses root tools, selected packages, and fail-fast gates', async (t) => {
  const fixture = createFixture();
  try {
    await t.test('1 builds in dependency order and 2 exactly once', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/service.ts']);
      const capture = captureRunner();
      runAffectedValidation(plan, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: capture.runner,
        fixture: true,
      });
      const builds = capture.calls.filter(
        (call) =>
          call.args.includes('--workspace') && call.args.includes('build'),
      );
      assert.deepEqual(
        builds.map((call) => call.args[call.args.indexOf('--workspace') + 1]),
        plan.buildPackages,
      );
      assert.equal(
        new Set(builds.map((call) => call.args.join(' '))).size,
        builds.length,
      );
    });
    await t.test(
      '3 tests through root Jest and 4 never package-local Lerna Jest',
      () => {
        const plan = syntheticPlan(fixture, ['libs/independent/src/index.ts']);
        const capture = captureRunner();
        runAffectedValidation(plan, {
          cwd: fixture.cwd,
          validation: fixture.validation,
          runner: capture.runner,
          fixture: true,
        });
        const commands = joinedCalls(capture.calls);
        assert.match(commands, /jest[\\/]bin[\\/]jest\.js .*--runTestsByPath/);
        assert.doesNotMatch(commands, /lerna.*(?:test|jest)/);
      },
    );
    await t.test('5 handles zero test files', () => {
      fs.rmSync(
        path.join(fixture.cwd, 'libs', 'independent', 'src', 'unit.spec.ts'),
      );
      fs.rmSync(
        path.join(fixture.cwd, 'libs', 'independent', 'src', 'unit.test.ts'),
      );
      const plan = syntheticPlan(fixture, ['libs/independent/src/index.ts']);
      const capture = captureRunner();
      runAffectedValidation(plan, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: capture.runner,
        fixture: true,
      });
      assert.doesNotMatch(joinedCalls(capture.calls), /runTestsByPath/);
    });
    await t.test('6 generates Prisma clients for selected Prisma tests', () => {
      const plan = syntheticPlan(fixture, [
        'libs/storage-prisma/src/storage.spec.ts',
      ]);
      const capture = captureRunner();
      runAffectedValidation(plan, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: capture.runner,
        fixture: true,
      });
      assert.match(
        joinedCalls(capture.calls),
        /generate:test-clients.*cap-storage-prisma/,
      );
    });
    await t.test('7 DB integration and 8 e2e run only when enabled', () => {
      const release = syntheticPlan(fixture, ['tools/release-tool.js']);
      const releaseCapture = captureRunner();
      runAffectedValidation(release, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: releaseCapture.runner,
        fixture: true,
      });
      assert.doesNotMatch(
        joinedCalls(releaseCapture.calls),
        /test:integration:db|test:e2e/,
      );
      const storageApp = syntheticPlan(fixture, [
        'libs/storage-prisma/src/storage.ts',
        'apps/cap-test-app/src/main.ts',
      ]);
      const enabledCapture = captureRunner();
      runAffectedValidation(storageApp, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: enabledCapture.runner,
        fixture: true,
      });
      assert.match(joinedCalls(enabledCapture.calls), /test:integration:db/);
      assert.match(joinedCalls(enabledCapture.calls), /test:e2e/);
    });
    await t.test('9 packs only selected packages', () => {
      const plan = syntheticPlan(fixture, ['libs/independent/README.md']);
      const capture = captureRunner();
      runAffectedValidation(plan, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: capture.runner,
        fixture: true,
      });
      const packs = capture.calls.filter((call) => call.args.includes('pack'));
      assert.equal(packs.length, 1);
      assert.ok(packs[0].args.includes(names.independent));
      assert.ok(packs[0].args.includes('--ignore-scripts'));
      const builds = capture.calls.filter(
        (call) =>
          call.args.includes('build') && call.args.includes(names.independent),
      );
      assert.equal(builds.length, 1);
    });
    await t.test('10 runs only selected specialized smoke checks', () => {
      const plan = syntheticPlan(fixture, [
        'libs/transport-kafka/src/index.ts',
      ]);
      const capture = captureRunner();
      runAffectedValidation(plan, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: capture.runner,
        fixture: true,
      });
      const commands = joinedCalls(capture.calls);
      assert.match(commands, /pack:smoke:kafka/);
      assert.doesNotMatch(
        commands,
        /pack:smoke:rabbitmq|pack:smoke:aws-sns-sqs/,
      );
    });
    await t.test(
      '11 stops at first failed gate and 12 preserves exit status',
      () => {
        const plan = syntheticPlan(fixture, ['libs/independent/src/index.ts']);
        const capture = captureRunner({ failGate: 'lint', exitCode: 23 });
        assert.throws(
          () =>
            runAffectedValidation(plan, {
              cwd: fixture.cwd,
              validation: fixture.validation,
              runner: capture.runner,
              fixture: true,
              printSummary: false,
            }),
          (error) =>
            error instanceof AffectedCommandError && error.exitCode === 23,
        );
        assert.doesNotMatch(joinedCalls(capture.calls), /--workspace/);
      },
    );
    await t.test('13 writes a useful summary', () => {
      const plan = syntheticPlan(fixture, ['libs/core/src/index.ts']);
      const summary = formatPlanSummary(plan, {
        databaseIntegration: 'passed',
      });
      for (const value of [
        'Base SHA',
        'Head SHA',
        'Changed-file count',
        'Directly affected packages',
        'Affected dependents',
        'Build packages',
        'Test packages',
        'Conditional gates',
        'Database integration: passed',
        'Skipped expensive gates',
      ])
        assert.match(summary, new RegExp(value));
    });
    await t.test('14 cleans generated temporary plan files', () => {
      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'cap-plan-cleanup-'),
      );
      const capture = captureRunner();
      const head = git(fixture.cwd, ['rev-parse', 'HEAD']);
      main(['run', '--base', head, '--head', head], {
        cwd: fixture.cwd,
        validation: fixture.validation,
        fixture: true,
        runner: capture.runner,
        tempDir,
        print: false,
      });
      assert.deepEqual(fs.readdirSync(tempDir), []);
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
    await t.test(
      '15 Jest and absolute test paths remain arguments to approved Node',
      () => {
        const plan = syntheticPlan(fixture, ['libs/core/src/index.ts']);
        const capture = captureRunner();
        runAffectedValidation(plan, {
          cwd: fixture.cwd,
          validation: fixture.validation,
          runner: capture.runner,
          fixture: true,
        });
        const jest = capture.calls.find((call) =>
          call.args.some((arg) => /jest[\\/]bin[\\/]jest\.js$/u.test(arg)),
        );
        assert.ok(jest);
        assert.equal(jest.kind, commandKinds.node);
        assert.equal(jest.command, process.execPath);
        assert.equal(path.isAbsolute(jest.args[0]), true);
        assert.notEqual(jest.command, jest.args[0]);
        assert.equal(jest.shell, false);
      },
    );
    await t.test(
      '16 package builds remain allowlisted npm workspace invocations',
      () => {
        const plan = syntheticPlan(fixture, ['libs/core/src/index.ts']);
        const capture = captureRunner();
        runAffectedValidation(plan, {
          cwd: fixture.cwd,
          validation: fixture.validation,
          runner: capture.runner,
          fixture: true,
        });
        const builds = capture.calls.filter(
          (call) =>
            call.args.includes('--workspace') && call.args.includes('build'),
        );
        assert.ok(builds.length > 0);
        for (const call of builds) {
          assert.equal(call.kind, commandKinds.npm);
          assert.ok(['npm', process.execPath].includes(call.command));
          assert.equal(call.shell, false);
        }
      },
    );
    await t.test(
      '17 plan JSON cannot select a command kind or executable',
      () => {
        const plan = syntheticPlan(fixture, ['libs/independent/src/index.ts']);
        plan.commandKind = 'custom';
        plan.command = path.resolve(fixture.cwd, 'untrusted-command.exe');
        const capture = captureRunner();
        runAffectedValidation(plan, {
          cwd: fixture.cwd,
          validation: fixture.validation,
          runner: capture.runner,
          fixture: true,
        });
        for (const call of capture.calls) {
          assert.ok(Object.values(commandKinds).includes(call.kind));
          assert.notEqual(call.command, plan.command);
        }
      },
    );
    await t.test(
      '18 changed filenames remain data rather than executables',
      () => {
        const changed = 'libs/independent/src/untrusted-command.exe';
        const plan = syntheticPlan(fixture, [changed]);
        const capture = captureRunner();
        runAffectedValidation(plan, {
          cwd: fixture.cwd,
          validation: fixture.validation,
          runner: capture.runner,
          fixture: true,
        });
        assert.deepEqual(plan.changedFiles, [changed]);
        assert.equal(
          capture.calls.some((call) =>
            call.command.includes('untrusted-command'),
          ),
          false,
        );
      },
    );
    await t.test('19 streaming commands explicitly inherit output', () => {
      const plan = syntheticPlan(fixture, ['libs/independent/README.md']);
      const capture = captureRunner();
      runAffectedValidation(plan, {
        cwd: fixture.cwd,
        validation: fixture.validation,
        runner: capture.runner,
        fixture: true,
      });
      assert.ok(capture.calls.length > 0);
      assert.ok(capture.calls.every((call) => call.stdio === 'inherit'));
      assert.ok(capture.calls.every((call) => call.shell === false));
    });
    await t.test(
      '20 startup failures retain the gate and child diagnostic',
      () => {
        const plan = syntheticPlan(fixture, ['libs/independent/README.md']);
        const capture = captureRunner({
          startupErrorGate: 'packageVerify',
          startupErrorMessage: 'ENOENT while starting approved executable',
        });
        assert.throws(
          () =>
            runAffectedValidation(plan, {
              cwd: fixture.cwd,
              validation: fixture.validation,
              runner: capture.runner,
              fixture: true,
              printSummary: false,
            }),
          (error) =>
            error instanceof AffectedCommandError &&
            /packageVerify failed to start: ENOENT while starting approved executable/u.test(
              error.message,
            ),
        );
      },
    );
    await t.test('21 injected invocation records are deterministic', () => {
      const plan = syntheticPlan(fixture, ['libs/independent/README.md']);
      const run = () => {
        const capture = captureRunner();
        runAffectedValidation(plan, {
          cwd: fixture.cwd,
          validation: fixture.validation,
          runner: capture.runner,
          fixture: true,
        });
        return capture.calls.map(
          ({ kind, command, args, cwd, encoding, stdio, shell, gate }) => ({
            kind,
            command,
            args,
            cwd,
            encoding,
            stdio,
            shell,
            gate,
          }),
        );
      };
      assert.deepEqual(run(), run());
    });
  } finally {
    fixture.cleanup();
  }
});

test('CI workflow invariants preserve one PR path and complete main/release safety', () => {
  const ci = fs.readFileSync(
    path.join(repositoryRoot, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );
  const release = fs.readFileSync(
    path.join(repositoryRoot, '.github', 'workflows', 'release.yml'),
    'utf8',
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
  );
  assert.match(ci, /pull_request:\s*\n\s+branches: \[main\]/);
  assert.match(ci, /push:\s*\n\s+branches: \[main\]/);
  assert.match(ci, /workflow_dispatch:/);
  assert.match(ci, /github\.event_name == 'pull_request'/);
  assert.match(ci, /github\.event\.pull_request\.base\.sha/);
  assert.doesNotMatch(ci, /^  affected-checks:/m);
  const buildAndTest = ci.slice(
    ci.indexOf('  build-and-test:'),
    ci.indexOf('  rabbitmq-integration:'),
  );
  assert.equal(
    (buildAndTest.match(/run: npm ci --package-lock=true/g) || []).length,
    1,
  );
  assert.equal((ci.match(/run: npm ci --package-lock=true/g) || []).length, 5);
  assert.match(ci, /concurrency:/);
  assert.match(
    ci,
    /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/,
  );
  assert.match(ci, /^  build-and-test:/m);
  assert.match(ci, /fetch-depth: 0/);
  assert.match(ci, /github\.event_name != 'pull_request'/);
  for (const command of [
    'packages:verify',
    'release:verify',
    'test:release-tooling',
    'verify:legacy-package-names',
    'lint:check',
    'fallow:ci',
    'fallow:health:ci',
    'npm run build',
    'examples:check',
    'docs:api',
    'npm test --silent',
    'test:e2e',
    'test:integration:db',
    'pack:dry-run',
    'pack:smoke:rabbitmq',
    'pack:smoke:kafka',
    'pack:smoke:aws-sns-sqs',
    'pack:smoke:storage-nest',
    'pack:smoke:dashboard-isolation',
  ])
    assert.match(
      ci,
      new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  for (const block of buildAndTest.split(/\n      - name:/u).slice(1)) {
    if (
      /run: (?:npm run packages:verify|npm run release:verify|npm run build|npm test --silent|npm run test:integration:db|npm run pack:dry-run)/u.test(
        block,
      )
    )
      assert.match(block, /github\.event_name != 'pull_request'/);
  }
  assert.doesNotMatch(
    ci,
    /npm\s+publish|lerna\s+publish|release-tool\.js execute/,
  );
  assert.doesNotMatch(
    ci,
    /NPM_TOKEN|RELEASE_GITHUB_TOKEN|SERVICEBUS_CONNECTION_STRING:[^\n]*pull_request/,
  );
  assert.match(release, /workflow_dispatch:/);
  assert.match(release, /release-tool\.js execute/);
  assert.match(release, /test:integration:db/);
  assert.match(release, /pack:dry-run/);
  assert.match(
    ci,
    /github\.event_name == 'workflow_dispatch'.*run_rabbitmq_integration/,
  );
  assert.doesNotMatch(
    manifest.scripts['ci:affected'],
    /lerna\s+(run|exec).*test|jest/,
  );
  assert.doesNotMatch(manifest.scripts['test:affected'] || '', /lerna/);
});
