'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  LintGateVerificationError,
  expectedScripts,
  verifyLintGate,
  verifyLintGateSources,
} = require('./verify-lint-gate');

const repositoryRoot = path.resolve(__dirname, '..');
const sourceFiles = Object.freeze({
  rootPackage: path.join(repositoryRoot, 'package.json'),
  prismaPackage: path.join(
    repositoryRoot,
    'libs',
    'cap-storage-prisma',
    'package.json',
  ),
  gitignore: path.join(repositoryRoot, '.gitignore'),
});
const sources = Object.freeze({
  rootPackage: fs.readFileSync(sourceFiles.rootPackage, 'utf8'),
  prismaPackage: fs.readFileSync(sourceFiles.prismaPackage, 'utf8'),
  gitignore: fs.readFileSync(sourceFiles.gitignore, 'utf8'),
});

function mutatePackage(source, mutation) {
  const value = JSON.parse(source);
  mutation(value);
  return JSON.stringify(value);
}

function expectFailure(changes, pattern) {
  assert.throws(
    () => verifyLintGateSources({ ...sources, ...changes }),
    (error) =>
      error instanceof LintGateVerificationError &&
      pattern.test(error.message),
  );
}

test('repository lint wiring generates Prisma before warning-fatal lint', () => {
  const result = verifyLintGate({ cwd: repositoryRoot });
  assert.equal(result.scripts.generatePrisma, expectedScripts.generatePrisma);
  assert.match(result.lintCheck, /--max-warnings=0/u);
});

test('lint wiring verifier rejects generation and warning-gate regressions', async (t) => {
  await t.test('root generation bypasses the package workspace', () => {
    expectFailure(
      {
        rootPackage: mutatePackage(sources.rootPackage, (value) => {
          value.scripts['generate:prisma'] =
            'prisma generate --schema libs/cap-storage-prisma/prisma/schema.prisma';
        }),
      },
      /must select @mikara89\/cap-storage-prisma/u,
    );
  });
  await t.test('lint lifecycle no longer generates Prisma first', () => {
    expectFailure(
      {
        rootPackage: mutatePackage(sources.rootPackage, (value) => {
          delete value.scripts['prelint:check'];
        }),
      },
      /must run generate:prisma before lint:check/u,
    );
  });
  await t.test('Prisma schema ownership moves to the root', () => {
    expectFailure(
      {
        prismaPackage: mutatePackage(sources.prismaPackage, (value) => {
          value.scripts.generate = 'prisma generate';
        }),
      },
      /workspace must own its prisma\/schema\.prisma path/u,
    );
  });
  await t.test('lint permits warnings', () => {
    expectFailure(
      {
        rootPackage: mutatePackage(sources.rootPackage, (value) => {
          value.scripts['lint:check'] =
            'eslint "{src,apps,libs,test}/**/*.ts" --max-warnings=1';
        }),
      },
      /must enforce --max-warnings=0/u,
    );
  });
  await t.test('generated test clients become trackable', () => {
    expectFailure(
      {
        gitignore: sources.gitignore.replace(
          'libs/cap-storage-prisma/prisma/generated/',
          '',
        ),
      },
      /generated Prisma test clients must be ignored/u,
    );
  });
});

test('ESLint exits non-zero when a temporary fixture produces a warning', () => {
  const fixture = path.join(
    repositoryRoot,
    'libs',
    'cap-core',
    'src',
    `lint-warning-fixture-${process.pid}.ts`,
  );
  const eslintCli = path.join(
    repositoryRoot,
    'node_modules',
    'eslint',
    'bin',
    'eslint.js',
  );

  try {
    fs.writeFileSync(fixture, 'export const lintWarningFixture: any = 1;\n');
    const result = spawnSync(
      process.execPath,
      [eslintCli, fixture, '--max-warnings=0'],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        shell: false,
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, output);
    assert.match(output, /@typescript-eslint\/no-explicit-any/u);
    assert.match(output, /1 warning/u);
    assert.match(output, /ESLint found too many warnings/u);
  } finally {
    fs.rmSync(fixture, { force: true });
  }
});
