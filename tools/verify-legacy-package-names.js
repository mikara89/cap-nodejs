'use strict';

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

const legacyPackages = Object.freeze([
  '@cap/cap-nest',
  '@cap/cap-dashboard',
  '@cap/mikroorm-storage',
  '@cap/azure-servicebus-transport',
  '@cap/nestjs-microservices-transport',
]);

const ignoredDirectories = new Set([
  '.git',
  '.nx',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const allowlistedFiles = new Set([
  'CHANGELOG.md',
  'docs/legacy-packages.md',
  'tools/verify-legacy-package-names.js',
  'tools/verify-legacy-package-names.test.js',
]);

function isAllowlisted(relativePath) {
  return (
    allowlistedFiles.has(relativePath) ||
    relativePath.startsWith('docs/migration/') ||
    relativePath.startsWith('docs/migrations/')
  );
}

function isActiveSurface(relativePath) {
  if (isAllowlisted(relativePath)) return false;

  const baseName = path.posix.basename(relativePath);
  if (
    relativePath === 'package.json' ||
    relativePath.endsWith('/package.json') ||
    relativePath === 'package-lock.json' ||
    /^tsconfig[^/]*\.json$/u.test(baseName) ||
    relativePath === 'nest-cli.json' ||
    relativePath === 'typedoc.json' ||
    relativePath === 'README.md' ||
    /^libs\/[^/]+\/README\.md$/u.test(relativePath)
  ) {
    return true;
  }

  return (
    /^libs\/[^/]+\/src\//u.test(relativePath) ||
    relativePath.startsWith('apps/') ||
    relativePath.startsWith('examples/') ||
    relativePath.startsWith('.github/') ||
    (relativePath.startsWith('tools/') && !relativePath.endsWith('.test.js'))
  );
}

function listRepositoryFiles(directory = rootDir, baseDir = directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return [];

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listRepositoryFiles(absolutePath, baseDir);
    if (!entry.isFile()) return [];

    return [path.relative(baseDir, absolutePath).replaceAll('\\', '/')];
  });
}

function findLegacyReferences(directory = rootDir, relativePaths) {
  const files = relativePaths ?? listRepositoryFiles(directory);
  const matches = [];

  for (const relativePath of files) {
    if (!isActiveSurface(relativePath)) continue;

    const absolutePath = path.join(directory, relativePath);
    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const packageName of legacyPackages) {
        if (line.includes(packageName)) {
          matches.push({ line: index + 1, packageName, relativePath });
        }
      }
    });
  }

  return matches;
}

function findLegacyWorkspacePackages(directory = rootDir) {
  const libsDirectory = path.join(directory, 'libs');
  if (!fs.existsSync(libsDirectory)) return [];

  return fs
    .readdirSync(libsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifestPath = path.join(libsDirectory, entry.name, 'package.json');
      if (!fs.existsSync(manifestPath)) return [];
      const { name } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return typeof name === 'string' && name.startsWith('@cap/')
        ? [{ name, relativePath: `libs/${entry.name}/package.json` }]
        : [];
    });
}

function verifyLegacyPackageNames(directory = rootDir) {
  const references = findLegacyReferences(directory);
  const workspacePackages = findLegacyWorkspacePackages(directory);
  if (references.length === 0 && workspacePackages.length === 0) return;

  const details = [
    ...references.map(
      ({ line, packageName, relativePath }) =>
        `${relativePath}:${line} contains ${packageName}`,
    ),
    ...workspacePackages.map(
      ({ name, relativePath }) => `${relativePath} declares ${name}`,
    ),
  ];
  throw new Error(
    `Deprecated @cap package names are not allowed in active repository surfaces:\n${details.join('\n')}`,
  );
}

if (require.main === module) {
  verifyLegacyPackageNames();
  console.log('Legacy package-name verification passed.');
}

module.exports = {
  findLegacyReferences,
  findLegacyWorkspacePackages,
  isActiveSurface,
  isAllowlisted,
  legacyPackages,
  verifyLegacyPackageNames,
};
