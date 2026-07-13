'use strict';

const path = require('node:path');
const packagesByCwd = new Map();

function dependencyRoot() {
  return (
    process.env.CAP_RELEASE_DEPENDENCY_ROOT || path.resolve(__dirname, '..')
  );
}

function loadReleasePolicy() {
  return require(path.join(dependencyRoot(), 'tools', 'release-tool.js'));
}

function loadConventionalCommitsPreset() {
  return require(
    path.join(
      dependencyRoot(),
      'node_modules',
      'conventional-changelog-conventionalcommits',
    ),
  );
}

function packageByName(name, cwd = process.cwd()) {
  const resolvedCwd = path.resolve(cwd);
  if (!packagesByCwd.has(resolvedCwd)) {
    const { discoverPackages } = loadReleasePolicy();
    packagesByCwd.set(
      resolvedCwd,
      new Map(
        discoverPackages(resolvedCwd, { fixture: true }).map((pkg) => [
          pkg.name,
          pkg,
        ]),
      ),
    );
  }
  const pkg = packagesByCwd.get(resolvedCwd).get(name);
  if (pkg) return pkg;
  throw new Error(`Unable to resolve changelog package ${name} under libs/*.`);
}

module.exports = async function packageOwnedChangelogPreset(config = {}) {
  const preset = await loadConventionalCommitsPreset()(config);
  const originalTransform = preset.writerOpts.transform;
  const ownership = new Map();

  const transform = (commit, context) => {
    const transformed = originalTransform(commit, context);
    if (!transformed) return transformed;

    const packageName = context.packageData?.name;
    if (!packageName || !commit.hash) {
      throw new Error(
        'Package-owned changelog filtering requires package metadata and a commit SHA.',
      );
    }

    const key = `${packageName}:${commit.hash}`;
    if (!ownership.has(key)) {
      const { packageOwnsCommit } = loadReleasePolicy();
      ownership.set(
        key,
        packageOwnsCommit(
          packageByName(packageName),
          commit.hash,
          process.cwd(),
        ),
      );
    }
    return ownership.get(key) ? transformed : undefined;
  };

  const writerOpts = { ...preset.writerOpts, transform };
  return {
    ...preset,
    writerOpts,
    conventionalChangelog: {
      ...preset.conventionalChangelog,
      writerOpts,
    },
  };
};
