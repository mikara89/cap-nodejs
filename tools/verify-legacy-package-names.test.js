'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  findLegacyReferences,
  findLegacyWorkspacePackages,
  legacyPackages,
  verifyLegacyPackageNames,
} = require('./verify-legacy-package-names');

function withFixture(files, fn) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-legacy-names-'));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(directory, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
    return fn(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('detects every deprecated package name in active code', () => {
  withFixture(
    {
      'libs/example/src/legacy.ts': legacyPackages.join('\n'),
    },
    (directory) => {
      const matches = findLegacyReferences(directory);
      assert.deepEqual(
        matches.map((match) => match.packageName).sort(),
        [...legacyPackages].sort(),
      );
      assert.throws(
        () => verifyLegacyPackageNames(directory),
        /deprecated @cap/iu,
      );
    },
  );
});

test('accepts allowlisted migration and history documentation', () => {
  withFixture(
    {
      'CHANGELOG.md': legacyPackages.join('\n'),
      'docs/legacy-packages.md': legacyPackages.join('\n'),
      'docs/migration/legacy.md': legacyPackages.join('\n'),
      'tools/verify-legacy-package-names.test.js': legacyPackages.join('\n'),
    },
    (directory) => {
      assert.deepEqual(findLegacyReferences(directory), []);
      assert.doesNotThrow(() => verifyLegacyPackageNames(directory));
    },
  );
});

test('accepts canonical @mikara89 package names', () => {
  withFixture(
    {
      'examples/canonical.ts': [
        "import '@mikara89/cap-nest';",
        "import '@mikara89/cap-dashboard-nest';",
        "import '@mikara89/cap-storage-mikro-orm';",
        "import '@mikara89/cap-transport-azure-servicebus';",
        "import '@mikara89/cap-transport-nestjs-microservices';",
      ].join('\n'),
    },
    (directory) => {
      assert.deepEqual(findLegacyReferences(directory), []);
      assert.doesNotThrow(() => verifyLegacyPackageNames(directory));
    },
  );
});

test('detects deprecated workspace package names', () => {
  withFixture(
    {
      'libs/legacy/package.json': JSON.stringify({ name: '@cap/cap-nest' }),
    },
    (directory) => {
      assert.deepEqual(findLegacyWorkspacePackages(directory), [
        { name: '@cap/cap-nest', relativePath: 'libs/legacy/package.json' },
      ]);
      assert.throws(
        () => verifyLegacyPackageNames(directory),
        /declares @cap\/cap-nest/u,
      );
    },
  );
});

test('current workspace packages do not use the deprecated @cap scope', () => {
  assert.deepEqual(findLegacyWorkspacePackages(), []);
});
