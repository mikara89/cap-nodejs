'use strict';

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const prismaWorkspace = '@mikara89/cap-storage-prisma';
const expectedScripts = Object.freeze({
  generatePrisma: `npm run generate --workspace ${prismaWorkspace}`,
  prelintCheck: 'npm run generate:prisma',
  prismaGenerate: 'prisma generate --schema prisma/schema.prisma',
});

class LintGateVerificationError extends Error {}

function fail(message) {
  throw new LintGateVerificationError(message);
}

function parsePackage(source, fileName) {
  try {
    return JSON.parse(source);
  } catch (error) {
    fail(`${fileName} must contain valid JSON: ${error.message}`);
  }
}

function ignoreLines(source) {
  return new Set(
    source
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#')),
  );
}

function verifyLintGateSources({ rootPackage, prismaPackage, gitignore }) {
  const root = parsePackage(rootPackage, 'package.json');
  const prisma = parsePackage(
    prismaPackage,
    'libs/cap-storage-prisma/package.json',
  );
  const rootScripts = root.scripts ?? {};
  const prismaScripts = prisma.scripts ?? {};

  if (rootScripts['generate:prisma'] !== expectedScripts.generatePrisma) {
    fail(
      `generate:prisma must select ${prismaWorkspace} through the workspace-owned generate script`,
    );
  }
  if (rootScripts['prelint:check'] !== expectedScripts.prelintCheck) {
    fail('prelint:check must run generate:prisma before lint:check');
  }
  if (prismaScripts.generate !== expectedScripts.prismaGenerate) {
    fail('the Prisma workspace must own its prisma/schema.prisma path');
  }
  if (rootScripts['generate:prisma'].includes('--schema')) {
    fail('the root Prisma generation script must not duplicate a schema path');
  }

  const lintCheck = rootScripts['lint:check'];
  if (typeof lintCheck !== 'string' || !lintCheck.startsWith('eslint ')) {
    fail('lint:check must run ESLint');
  }
  const warningAllowance = /--max-warnings(?:=|\s+)(\S+)/u.exec(lintCheck);
  if (!warningAllowance || warningAllowance[1] !== '0') {
    fail('lint:check must enforce --max-warnings=0');
  }

  const rootGenerationOwners = Object.entries(rootScripts).filter(
    ([, command]) =>
      typeof command === 'string' &&
      command.includes(`generate --workspace ${prismaWorkspace}`),
  );
  if (
    rootGenerationOwners.length !== 1 ||
    rootGenerationOwners[0][0] !== 'generate:prisma'
  ) {
    fail('generate:prisma must be the single root source of Prisma generation');
  }

  const ignored = ignoreLines(gitignore);
  if (!ignored.has('/node_modules')) {
    fail('root node_modules, including generated Prisma Client output, must be ignored');
  }
  if (!ignored.has('libs/cap-storage-prisma/prisma/generated/')) {
    fail('package-owned generated Prisma test clients must be ignored');
  }

  return {
    lintCheck,
    prismaWorkspace,
    scripts: expectedScripts,
  };
}

function verifyLintGate({ cwd = rootDir } = {}) {
  return verifyLintGateSources({
    rootPackage: fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'),
    prismaPackage: fs.readFileSync(
      path.join(cwd, 'libs', 'cap-storage-prisma', 'package.json'),
      'utf8',
    ),
    gitignore: fs.readFileSync(path.join(cwd, '.gitignore'), 'utf8'),
  });
}

if (require.main === module) {
  const result = verifyLintGate();
  process.stdout.write(
    `Verified Prisma generation before warning-fatal lint for ${result.prismaWorkspace}.\n`,
  );
}

module.exports = {
  LintGateVerificationError,
  expectedScripts,
  prismaWorkspace,
  verifyLintGate,
  verifyLintGateSources,
};
