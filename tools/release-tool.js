'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const semver = require('semver');

const rootDir = path.resolve(__dirname, '..');
const registry = 'https://registry.npmjs.org/';
const repositoryUrl = 'https://github.com/mikara89/cap-nodejs';
const bootstrapConfirmation = 'PUBLISH_ALL_TO_NPM';
const coordinatedMajorConfirmation = 'PUBLISH_COORDINATED_MAJOR';
const ignoredReleaseChanges = [
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/fixtures/**',
  '**/*.md',
  '**/tsconfig*.json',
];
const lernaCli = path.join(rootDir, 'node_modules', 'lerna', 'dist', 'cli.js');

class ReleaseToolError extends Error {}

function fail(message) {
  throw new ReleaseToolError(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || rootDir,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  });
  if (result.error) fail(`${command} failed to start: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) {
    const output = [result.stdout, result.stderr]
      .filter(Boolean)
      .join('\n')
      .trim();
    fail(
      `${command} ${args.join(' ')} failed with exit ${result.status}.${output ? `\n${output}` : ''}`,
    );
  }
  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function discoverPackages(cwd = rootDir) {
  const libsDir = path.join(cwd, 'libs');
  return fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(libsDir, entry.name);
      const manifestPath = path.join(dir, 'package.json');
      if (!fs.existsSync(manifestPath)) return undefined;
      const manifest = readJson(manifestPath);
      if (manifest.private) return undefined;
      return {
        dir,
        relativeDir: path.relative(cwd, dir).replaceAll('\\', '/'),
        manifestPath,
        manifest,
        name: manifest.name,
        version: manifest.version,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function verifyConfiguration(cwd = rootDir) {
  const lerna = readJson(path.join(cwd, 'lerna.json'));
  if (lerna.version !== 'independent')
    fail('lerna.json must use independent versioning.');
  const version = lerna.command?.version;
  if (
    version?.conventionalCommits !== true ||
    version?.createRelease !== 'github' ||
    version?.allowBranch !== 'main' ||
    version?.changelogPreset !== 'conventionalcommits' ||
    version?.excludeDependents !== true ||
    JSON.stringify(version?.ignoreChanges) !==
      JSON.stringify(ignoredReleaseChanges)
  ) {
    fail(
      'lerna.json command.version must enable Conventional Commits, GitHub releases, main-only releases, the conventionalcommits preset, dependent exclusion, and verified non-artifact ignore patterns.',
    );
  }

  const installedLerna = readJson(
    path.join(cwd, 'node_modules', 'lerna', 'package.json'),
  ).version;
  if (installedLerna !== '9.0.7') {
    fail(`Unsupported Lerna ${installedLerna}; expected exactly 9.0.7.`);
  }
  const installedPreset = readJson(
    path.join(
      cwd,
      'node_modules',
      'conventional-changelog-conventionalcommits',
      'package.json',
    ),
  ).version;
  if (installedPreset !== '7.0.2') {
    fail(
      `Unsupported conventionalcommits preset ${installedPreset}; expected 7.0.2 for Lerna 9 compatibility.`,
    );
  }

  const installedSource = fs.readFileSync(
    path.join(cwd, 'node_modules', 'lerna', 'dist', 'index.js'),
    'utf8',
  );
  const installedSchema = fs.readFileSync(
    path.join(cwd, 'node_modules', 'lerna', 'schemas', 'lerna-schema.json'),
    'utf8',
  );
  if (!installedSchema.includes('"excludeDependents"')) {
    fail('Installed Lerna schema does not support version.excludeDependents.');
  }
  for (const option of [
    'from-git',
    'from-package',
    '--conventional-prerelease',
    '--conventional-graduate',
    '--force-publish',
    '--force-conventional-graduate',
    '--create-release',
    '--dist-tag',
    '--registry',
  ]) {
    if (!installedSource.includes(option.replace(/^--/, ''))) {
      fail(`Installed Lerna does not implement required option ${option}.`);
    }
  }
  if (!installedSource.includes('/-/npm/v1/oidc/token/exchange/package/')) {
    fail(
      'Installed Lerna does not include npm OIDC trusted-publishing support.',
    );
  }
  if (!installedSource.includes('git tag %s -m %s')) {
    fail('Installed Lerna does not create annotated package tags by default.');
  }

  const packages = discoverPackages(cwd);
  if (packages.length === 0) fail('No publishable packages were discovered.');
  const names = new Set();
  for (const pkg of packages) {
    if (!pkg.name?.startsWith('@mikara89/cap-'))
      fail(`Unexpected publishable package ${pkg.name}.`);
    if (names.has(pkg.name)) fail(`Duplicate package name ${pkg.name}.`);
    names.add(pkg.name);
    if (!semver.valid(pkg.version))
      fail(`${pkg.name} has invalid version ${pkg.version}.`);
    if (
      pkg.manifest.publishConfig?.registry !== registry ||
      pkg.manifest.publishConfig?.access !== 'public'
    ) {
      fail(`${pkg.name} must publish publicly to ${registry}.`);
    }
    if (pkg.manifest.repository?.url !== repositoryUrl) {
      fail(`${pkg.name} repository URL must be ${repositoryUrl}.`);
    }
  }

  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const lockfile = readJson(path.join(cwd, 'package-lock.json'));
  for (const pkg of packages) {
    const locked = lockfile.packages?.[pkg.relativeDir];
    if (!locked || locked.version !== pkg.version) {
      fail(`package-lock.json does not match ${pkg.name}@${pkg.version}.`);
    }
    for (const section of [
      'peerDependencies',
      'devDependencies',
      'optionalDependencies',
    ]) {
      for (const name of Object.keys(pkg.manifest[section] || {})) {
        if (byName.has(name)) {
          fail(
            `${pkg.name} must declare internal ${name} in dependencies, not ${section}; duplicate/local-only ranges prevent Lerna from updating published ranges.`,
          );
        }
      }
    }
    for (const [name, range] of Object.entries(
      pkg.manifest.dependencies || {},
    )) {
      const target = byName.get(name);
      if (!target) continue;
      if (
        !semver.validRange(range) ||
        !semver.satisfies(target.version, range)
      ) {
        fail(
          `${pkg.name} internal dependency ${name}@${range} does not include ${target.version}.`,
        );
      }
      if (locked.dependencies?.[name] !== range) {
        fail(
          `package-lock.json range for ${pkg.name} -> ${name} does not match ${range}.`,
        );
      }
    }
  }

  return { installedLerna, installedPreset, packages };
}

function normalizeInputs(input) {
  const operation = input.operation || 'release';
  const channel = input.channel || 'stable';
  const coordinatedMajor =
    input.coordinatedMajor === true || input.coordinatedMajor === 'true';
  const confirmation = input.confirmation || '';

  if (!['release', 'graduate', 'bootstrap'].includes(operation)) {
    fail(`Unsupported operation: ${operation}.`);
  }
  if (!['stable', 'beta', 'rc'].includes(channel))
    fail(`Unsupported channel: ${channel}.`);
  if (operation === 'graduate' && channel !== 'stable') {
    fail('Graduation requires channel=stable.');
  }
  if (operation === 'bootstrap') {
    if (channel !== 'stable')
      fail('Bootstrap cannot use a prerelease channel.');
    if (coordinatedMajor)
      fail('Bootstrap cannot be combined with coordinated_major.');
    if (confirmation !== bootstrapConfirmation) {
      fail(`Bootstrap requires confirmation=${bootstrapConfirmation}.`);
    }
  }
  if (coordinatedMajor && confirmation !== coordinatedMajorConfirmation) {
    fail(
      `Coordinated major requires confirmation=${coordinatedMajorConfirmation}.`,
    );
  }

  return { operation, channel, coordinatedMajor, confirmation };
}

function distTagFor(channel) {
  return channel === 'stable' ? 'latest' : channel;
}

function packageTag(name, version) {
  return `${name}@${version}`;
}

function isReleaseCommit(subject, body = '') {
  const header = subject.trim();
  return (
    /^(feat|fix)(\([^)]*\))?!?:/i.test(header) ||
    /^[a-z][a-z0-9-]*(\([^)]*\))?!:/i.test(header) ||
    /(^|\n)BREAKING[ -]CHANGE:\s*\S/i.test(body)
  );
}

function hasReleaseRelevantCommit(commits) {
  return commits.some((commit) => isReleaseCommit(commit.subject, commit.body));
}

function tagCommit(tag, cwd = rootDir) {
  const result = run('git', ['rev-list', '-n', '1', `${tag}^{}`], {
    cwd,
    allowFailure: true,
  });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function headSha(cwd = rootDir) {
  return run('git', ['rev-parse', 'HEAD'], { cwd }).stdout.trim();
}

function assertCleanTree(cwd = rootDir) {
  const status = run(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=normal'],
    { cwd },
  ).stdout.trim();
  if (status) {
    fail(
      `Release planning and execution require a clean worktree. First entry: ${status.split(/\r?\n/u)[0]}`,
    );
  }
}

function commitExists(sha, cwd = rootDir) {
  return (
    run('git', ['cat-file', '-e', `${sha}^{commit}`], {
      cwd,
      allowFailure: true,
    }).status === 0
  );
}

function packageManifestAtCommit(pkg, commit, cwd = rootDir) {
  const result = run(
    'git',
    ['show', `${commit}:${pkg.relativeDir}/package.json`],
    { cwd, allowFailure: true },
  );
  if (result.status !== 0) return undefined;
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail(
      `${pkg.name} has an invalid package.json at ${commit}:${pkg.relativeDir}.`,
    );
  }
}

function packageArtifactFromTarball(buffer) {
  let archive;
  try {
    archive = zlib.gunzipSync(buffer);
  } catch (error) {
    fail(`npm artifact is not a valid gzip archive: ${error.message}`);
  }
  for (let offset = 0; offset + 512 <= archive.length; ) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const readString = (start, length) =>
      header
        .subarray(start, start + length)
        .toString('utf8')
        .replace(/\0.*$/u, '')
        .trim();
    const name = readString(0, 100);
    const prefix = readString(345, 155);
    const archivePath = prefix ? `${prefix}/${name}` : name;
    const sizeText = readString(124, 12);
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    if (!Number.isSafeInteger(size) || size < 0)
      fail(
        `npm artifact contains an invalid tar entry size for ${archivePath}.`,
      );
    const contentStart = offset + 512;
    if (archivePath === 'package/package.json') {
      try {
        return JSON.parse(
          archive.subarray(contentStart, contentStart + size).toString('utf8'),
        );
      } catch (error) {
        fail(`npm artifact package.json is invalid: ${error.message}`);
      }
    }
    offset = contentStart + Math.ceil(size / 512) * 512;
  }
  fail('npm artifact does not contain package/package.json.');
}

function integrityMatches(buffer, integrity) {
  return integrity
    .trim()
    .split(/\s+/u)
    .some((entry) => {
      const separator = entry.indexOf('-');
      if (separator <= 0) return false;
      const algorithm = entry.slice(0, separator);
      const expected = entry.slice(separator + 1);
      try {
        return (
          crypto.createHash(algorithm).update(buffer).digest('base64') ===
          expected
        );
      } catch {
        return false;
      }
    });
}

async function verifyRegistryArtifact(pkg, published, options = {}) {
  const dist = published?.dist;
  if (!dist?.tarball || !dist?.integrity)
    fail(`${pkg.name}@${pkg.version} npmjs metadata has no tarball integrity.`);
  const tarballUrl = new URL(dist.tarball);
  if (tarballUrl.origin !== new URL(registry).origin) {
    fail(`${pkg.name}@${pkg.version} artifact is not hosted by npmjs.`);
  }
  let response;
  try {
    response = await (options.artifactFetchImpl || globalThis.fetch)(
      tarballUrl,
      {
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch (error) {
    fail(
      `${pkg.name}@${pkg.version} artifact download failed: ${error.message}`,
    );
  }
  if (!response.ok) {
    fail(
      `${pkg.name}@${pkg.version} artifact download returned HTTP ${response.status}.`,
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!integrityMatches(buffer, dist.integrity)) {
    fail(`${pkg.name}@${pkg.version} npmjs artifact integrity mismatch.`);
  }
  if (
    dist.shasum &&
    crypto.createHash('sha1').update(buffer).digest('hex') !== dist.shasum
  ) {
    fail(`${pkg.name}@${pkg.version} npmjs artifact shasum mismatch.`);
  }
  const artifactManifest = packageArtifactFromTarball(buffer);
  if (
    artifactManifest.name !== pkg.name ||
    artifactManifest.version !== pkg.version
  ) {
    fail(
      `${pkg.name}@${pkg.version} npmjs tarball identifies as ${artifactManifest.name}@${artifactManifest.version}.`,
    );
  }
  return {
    tarball: dist.tarball,
    integrity: dist.integrity,
    shasum: dist.shasum,
  };
}

function commitsSinceTag(pkg, tag, cwd = rootDir) {
  const result = run(
    'git',
    [
      'log',
      '--format=%H%x1f%s%x1f%b%x1e',
      `${tag}..HEAD`,
      '--',
      pkg.relativeDir,
    ],
    { cwd },
  );
  return result.stdout
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha, subject, ...body] = record.split('\x1f');
      return { sha, subject, body: body.join('\x1f') };
    });
}

function isIgnoredReleasePath(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const fileName = normalized.split('/').pop();
  return (
    /\.(spec|test)\.ts$/u.test(fileName) ||
    /\.md$/u.test(fileName) ||
    /^tsconfig.*\.json$/u.test(fileName) ||
    normalized
      .split('/')
      .some((part) => ['test', 'tests', '__tests__', 'fixtures'].includes(part))
  );
}

function changedFiles(ref, pkg, cwd = rootDir) {
  return run('git', ['diff', '--name-only', ref, '--', pkg.relativeDir], {
    cwd,
  })
    .stdout.split(/\r?\n/u)
    .map((file) => file.trim())
    .filter(Boolean);
}

function commitFiles(sha, pkg, cwd = rootDir) {
  return run(
    'git',
    ['show', '--format=', '--name-only', sha, '--', pkg.relativeDir],
    { cwd },
  )
    .stdout.split(/\r?\n/u)
    .map((file) => file.trim())
    .filter(Boolean);
}

/**
 * Returns true when any artifact-relevant source file differs between two
 * commits for a package. Used by the head-anchored bootstrap to decide whether
 * an existing npmjs baseline tag can be placed at the current HEAD instead of
 * the older recorded gitHead.
 *
 * package.json is compared structurally after normalizing approved
 * administrative fields (version bump+restore, publishConfig.registry
 * migration, repository metadata correction).  README.md and CHANGELOG.md
 * are non-semantic.  .npmignore, build-consumed tsconfig files, and all other
 * source / declaration files are always significant.
 */
function sourceFilesChanged(
  baseCommit,
  headCommit,
  pkg,
  cwd = rootDir,
  bootstrapVersion = undefined,
) {
  const result = run(
    'git',
    [
      'diff',
      '--name-only',
      baseCommit,
      headCommit,
      '--',
      pkg.relativeDir,
    ],
    { cwd, allowFailure: true },
  );
  // When either ref is unavailable (e.g. mock SHAs in tests), conservatively
  // report files as changed so the caller falls back to the recorded gitHead.
  if (result.status !== 0) return true;

  // — Version invariant check (runs even when zero files differ) —
  // If the caller supplied an expected bootstrap version and the current
  // manifest does not match, this is a significant change regardless of
  // whether any other files differ.
  if (bootstrapVersion !== undefined) {
    const headManifest = packageManifestAtCommit(pkg, headCommit, cwd);
    if (!headManifest || headManifest.version !== bootstrapVersion) return true;
  }

  const files = result.stdout
    .split(/\r?\n/u)
    .map((f) => f.trim())
    .filter(Boolean);

  // Per-file classification patterns.
  const readmePattern = /[/\\]README\.md$/u;
  const changelogPattern = /[/\\]CHANGELOG\.md$/u;
  const packageJsonPattern = /[/\\]package\.json$/u;
  const npmignorePattern = /[/\\]\.npmignore$/u;
  // Build-consumed tsconfigs (tsconfig.json, tsconfig.build.json,
  // tsconfig.lib.json).  Lint/doc-only tsconfigs are not build-consumed.
  const buildTsconfigPattern =
    /[/\\]tsconfig(\.(build|lib))?\.json$/u;

  for (const file of files) {
    // Non-semantic documentation files.
    if (readmePattern.test(file) || changelogPattern.test(file)) continue;

    // .npmignore always affects the published artifact — check before
    // isIgnoredReleasePath which would otherwise mask it.
    if (npmignorePattern.test(file)) return true;

    // Build-consumed tsconfig changes affect compilation output — check
    // before isIgnoredReleasePath which treats all tsconfigs as ignored.
    if (buildTsconfigPattern.test(file)) return true;

    // Test / fixture / markdown patterns from the global ignore list.
    if (isIgnoredReleasePath(file)) continue;

    // package.json — compare structurally after administrative normalization.
    if (packageJsonPattern.test(file)) {
      if (
        packageJsonSemanticallyChanged(
          baseCommit,
          headCommit,
          pkg,
          cwd,
          bootstrapVersion,
        )
      )
        return true;
      continue;
    }

    // Any other changed file (source, declaration, etc.) is significant.
    return true;
  }

  return false;
}

/**
 * Structural package.json comparison against the bootstrap baseline.
 *
 * The baseline manifest (at baseCommit) represents the published npmjs
 * artifact.  The head manifest must match it after approved administrative
 * fields are normalized.  Section moves (peer→dep, dep→optional, etc.) and
 * range changes are always significant.
 *
 * Approved bootstrap-only normalizations:
 * 1. version — stripped after verifying the head version equals
 *    bootstrapVersion.
 * 2. publishConfig.registry — normalizes GitHub Packages → npmjs migration.
 * 3. publishConfig.access — normalizes explicit "public" to match npmjs
 *    default.
 * 4. repository — stripped.
 * 5. devDependencies file: references — removed only when they reference an
 *    existing workspace package whose name matches the key and whose version
 *    satisfies the declared dependency/peer range.
 */
function packageJsonSemanticallyChanged(
  baseCommit,
  headCommit,
  pkg,
  cwd = rootDir,
  bootstrapVersion = undefined,
) {
  const baseManifest = packageManifestAtCommit(pkg, baseCommit, cwd);
  const headManifest = packageManifestAtCommit(pkg, headCommit, cwd);
  if (!baseManifest || !headManifest) return true;

  const expectedVersion = bootstrapVersion ?? baseManifest.version;

  // — Version invariant —
  if (headManifest.version !== expectedVersion) return true;

  const baseNorm = normalizePackageForBootstrap(baseManifest, pkg, cwd);
  const headNorm = normalizePackageForBootstrap(headManifest, pkg, cwd);

  try {
    return JSON.stringify(baseNorm) !== JSON.stringify(headNorm);
  } catch {
    return true;
  }
}

/**
 * Strip approved administrative fields and normalize file: devDep references
 * so that repository metadata corrections do not register as semantic changes
 * during the one-time bootstrap.
 *
 * publishConfig is normalized narrowly:
 * - registry: GitHub Packages → registry.npmjs.org migration is stripped.
 * - access: explicit "public" is stripped (npmjs default).
 * Every other publishConfig field is compared unchanged.
 *
 * DevDependencies are preserved in full.  A file: reference is removed only
 * when all of the following hold:
 * 1. The same package name exists in dependencies or peerDependencies.
 * 2. The target workspace directory exists.
 * 3. The target manifest name matches the key.
 * 4. The target version satisfies the declared dependency/peer range.
 * Otherwise the file: reference change is significant.
 */
function normalizePackageForBootstrap(manifest, pkg, cwd = rootDir) {
  const normalized = { ...manifest };

  // — Approved administrative field normalizations —
  delete normalized.version;
  delete normalized.repository;

  // Narrow publishConfig normalization: only registry migration and
  // explicit "public" access are approved bootstrap adjustments.  Every
  // other publishConfig field is compared as-is.
  normalized.publishConfig = normalizePublishConfigForBootstrap(
    normalized.publishConfig,
  );

  // Normalize file: references in devDependencies.
  if (normalized.devDependencies) {
    normalized.devDependencies = normalizeDevDepFileRefs(
      normalized.devDependencies,
      normalized.dependencies,
      normalized.peerDependencies,
      pkg,
      cwd,
    );
  }

  return normalized;
}

/**
 * Narrow publishConfig normalization for the one-time bootstrap migration.
 *
 * - registry: if either manifest points at GitHub Packages
 *   (npm.pkg.github.com) or at registry.npmjs.org, strip the field so the
 *   migration itself is not a semantic change.
 * - access: if the value is exactly "public", strip it (npmjs default).
 *
 * Every other field (tag, directory, provenance, etc.) is compared as-is.
 */
function normalizePublishConfigForBootstrap(publishConfig) {
  if (!publishConfig) return publishConfig;
  const normalized = { ...publishConfig };

  const isNpmjsRegistry = (value) =>
    value === 'https://registry.npmjs.org/';
  const isGitHubRegistry = (value) =>
    typeof value === 'string' && value.includes('npm.pkg.github.com');

  if (
    normalized.registry &&
    (isNpmjsRegistry(normalized.registry) ||
      isGitHubRegistry(normalized.registry))
  ) {
    delete normalized.registry;
  }

  if (normalized.access === 'public') {
    delete normalized.access;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Remove file: devDependency references only when the referenced workspace
 * package can be verified to match the declared dependency.
 *
 * A file: ref is removed only when ALL of the following hold:
 * 1. The same package name exists in dependencies or peerDependencies.
 * 2. The target workspace directory (resolved from the file: path relative
 *    to pkg.dir) exists.
 * 3. The target manifest name matches the devDep key.
 * 4. The target manifest version satisfies the declared dep/peer range.
 *
 * If any condition fails, the file: ref is preserved as-is (significant).
 */
function normalizeDevDepFileRefs(
  devDependencies,
  dependencies,
  peerDependencies,
  pkg,
  cwd,
) {
  const clean = { ...devDependencies };
  const declaredDeps = {
    ...(dependencies || {}),
    ...(peerDependencies || {}),
  };

  for (const key of Object.keys(clean)) {
    const value = clean[key];
    if (!value?.startsWith?.('file:')) continue;

    // Condition 1: the same package must be declared in deps/peerDeps.
    const declaredRange = declaredDeps[key];
    if (declaredRange === undefined) continue;

    // Condition 2–4: resolve the file: path and verify the target.
    const relativePath = value.slice('file:'.length);
    const targetDir = path.resolve(
      pkg.dir || path.join(cwd, pkg.relativeDir),
      relativePath,
    );
    let targetManifest;
    try {
      targetManifest = JSON.parse(
        fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'),
      );
    } catch {
      // Target doesn't exist or is unreadable — keep the file: ref.
      continue;
    }

    // Condition 3: name must match.
    if (targetManifest.name !== key) continue;

    // Condition 4: version must satisfy the declared range.
    if (!semver.satisfies(targetManifest.version, declaredRange)) continue;

    // All conditions met — the file: ref is a workspace convenience
    // that does not affect the published artifact.
    delete clean[key];
  }

  return clean;
}

function validateReleaseSignals(packages, cwd = rootDir) {
  const changed = [];
  for (const pkg of packages) {
    const tag = packageTag(pkg.name, pkg.version);
    if (!tagCommit(tag, cwd))
      fail(
        `Missing baseline tag ${tag}; run bootstrap before a normal release.`,
      );
    const artifactChanges = changedFiles(`${tag}..HEAD`, pkg, cwd).filter(
      (file) => !isIgnoredReleasePath(file),
    );
    if (artifactChanges.length === 0) continue;
    const commits = commitsSinceTag(pkg, tag, cwd);
    const qualified = commits.some(
      (commit) =>
        isReleaseCommit(commit.subject, commit.body) &&
        commitFiles(commit.sha, pkg, cwd).some(
          (file) => !isIgnoredReleasePath(file),
        ),
    );
    if (!qualified) {
      fail(
        `${pkg.name} has publishable changes without a fix:, feat:, bang header, or BREAKING CHANGE commit. Reword the relevant commit before release.`,
      );
    }
    changed.push(pkg.name);
  }
  return changed;
}

function coordinatedTagCommit(
  packages,
  cwd = rootDir,
  getTagCommit = tagCommit,
) {
  const commits = new Set(
    packages.map((pkg) => getTagCommit(packageTag(pkg.name, pkg.version), cwd)),
  );
  if (commits.has(undefined) || commits.size !== 1) {
    fail(
      'Coordinated prerelease packages must have exact current-version tags on one shared Lerna version commit.',
    );
  }
  return [...commits][0];
}

function commonPublishArgs(distTag) {
  return [
    '--conventional-commits',
    '--create-release',
    'github',
    '--yes',
    '--registry',
    registry,
    '--dist-tag',
    distTag,
  ];
}

function buildReleaseCommand(input, options = {}) {
  const normalized = normalizeInputs(input);
  const { operation, channel, coordinatedMajor } = normalized;
  const distTag = distTagFor(channel);
  const args = ['publish'];

  if (operation === 'bootstrap') {
    args.push(
      'from-package',
      '--yes',
      '--registry',
      registry,
      '--dist-tag',
      'latest',
    );
    if (options.gitHead) args.push('--git-head', options.gitHead);
    return { args, distTag, normalized };
  }

  if (operation === 'graduate') {
    if (coordinatedMajor) {
      args.push('--conventional-graduate=*', '--force-conventional-graduate');
    } else {
      const graduatePackages = options.graduatePackages || [];
      args.push(
        graduatePackages.length > 0
          ? `--conventional-graduate=${graduatePackages.join(',')}`
          : '--conventional-graduate',
      );
    }
  } else if (coordinatedMajor) {
    if (channel === 'stable') args.push('major');
    if (channel === 'beta') args.push('premajor', '--preid', 'beta');
    if (channel === 'rc') args.push('prerelease', '--preid', 'rc');
    args.push('--force-publish=*');
  } else if (channel !== 'stable') {
    args.push('--conventional-prerelease', '--preid', channel);
  }

  args.push(...commonPublishArgs(distTag));
  if (options.forcePackages?.length) {
    args.push(`--force-publish=${options.forcePackages.join(',')}`);
  }
  return { args, distTag, normalized };
}

function versionArgsFromPublish(publishArgs) {
  const result = ['version'];
  for (let index = 1; index < publishArgs.length; index += 1) {
    const value = publishArgs[index];
    if (
      value === '--registry' ||
      value === '--dist-tag' ||
      value === '--create-release'
    ) {
      index += 1;
      continue;
    }
    if (value === 'from-package' || value === 'from-git') continue;
    result.push(value);
  }
  result.push('--no-git-tag-version', '--no-push', '--ignore-scripts');
  return result;
}

function cloneForSimulation(cwd = rootDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-lerna-plan-'));
  const clone = path.join(tempRoot, 'repo');
  run('git', ['clone', '--quiet', '--shared', cwd, clone], { cwd });
  run('git', ['checkout', '--quiet', '-B', 'main', headSha(cwd)], {
    cwd: clone,
  });
  return { tempRoot, clone };
}

function simulateLernaVersions(publishArgs, cwd = rootDir) {
  const { tempRoot, clone } = cloneForSimulation(cwd);
  try {
    const before = new Map(
      discoverPackages(clone).map((pkg) => [pkg.name, pkg.version]),
    );
    const args = versionArgsFromPublish(publishArgs);
    const result = run(process.execPath, [lernaCli, ...args], {
      cwd: clone,
      env: { CI: 'true', GH_TOKEN: '' },
      allowFailure: true,
    });
    const combined = [result.stdout, result.stderr].filter(Boolean).join('\n');
    if (result.status !== 0)
      fail(`Lerna plan simulation failed.\n${combined.trim()}`);
    const after = discoverPackages(clone);
    return after
      .filter((pkg) => before.get(pkg.name) !== pkg.version)
      .map((pkg) => ({
        name: pkg.name,
        oldVersion: before.get(pkg.name),
        newVersion: pkg.version,
        tag: packageTag(pkg.name, pkg.version),
        githubRelease: packageTag(pkg.name, pkg.version),
      }));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function stableBase(version) {
  const parsed = semver.parse(version);
  if (!parsed) fail(`Invalid version ${version}.`);
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

function assertPlanInvariants(plan, packages) {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const { operation, channel, coordinatedMajor } = plan.inputs;

  if (plan.distTag !== distTagFor(channel))
    fail('Plan dist-tag does not match channel.');
  if (channel === 'stable' && plan.distTag !== 'latest')
    fail('Stable releases must use latest.');
  if (channel !== 'stable' && plan.distTag === 'latest')
    fail('Prereleases must never use latest.');

  for (const change of plan.packages) {
    const before = byName.get(change.name)?.version;
    if (!before) fail(`Unknown package in plan: ${change.name}.`);
    const beforePrerelease = semver.prerelease(before);
    const afterPrerelease = semver.prerelease(change.newVersion);
    if (channel === 'beta' && afterPrerelease?.[0] !== 'beta')
      fail(`${change.name} is not a beta version.`);
    if (channel === 'rc' && afterPrerelease?.[0] !== 'rc')
      fail(`${change.name} is not an rc version.`);
    if (channel === 'stable' && afterPrerelease)
      fail(`${change.name} must be stable.`);
    if (operation === 'release' && channel === 'stable' && beforePrerelease) {
      fail(
        `${change.name} is already a prerelease; use operation=graduate instead of starting another release.`,
      );
    }
    if (
      operation === 'release' &&
      channel === 'beta' &&
      beforePrerelease &&
      beforePrerelease[0] !== 'beta'
    ) {
      fail(`${change.name} cannot move from ${beforePrerelease[0]} to beta.`);
    }

    if (operation === 'graduate') {
      if (!beforePrerelease)
        fail(`Graduation selected stable package ${change.name}.`);
      if (stableBase(before) !== change.newVersion)
        fail(`Graduation changed the base version for ${change.name}.`);
    }
    if (channel === 'rc' && semver.prerelease(before)?.[0] === 'beta') {
      if (stableBase(before) !== stableBase(change.newVersion)) {
        fail(`Beta-to-RC changed the base version for ${change.name}.`);
      }
    }
    if (coordinatedMajor && operation === 'release' && channel === 'stable') {
      if (semver.major(change.newVersion) !== semver.major(before) + 1) {
        fail(`Coordinated major did not major-bump ${change.name}.`);
      }
    }
    if (coordinatedMajor && operation === 'release' && channel === 'beta') {
      if (
        semver.major(change.newVersion) !== semver.major(before) + 1 ||
        afterPrerelease?.[0] !== 'beta'
      ) {
        fail(`Coordinated beta did not premajor-bump ${change.name}.`);
      }
    }
  }

  if (coordinatedMajor && plan.packages.length !== packages.length) {
    fail(`Coordinated release must select all ${packages.length} packages.`);
  }
  if (operation === 'graduate' && plan.packages.length === 0) {
    fail('Graduation requires at least one prerelease package.');
  }
}

function requiredDependents(packages, proposedPackages) {
  const proposed = new Map(
    proposedPackages.map((pkg) => [pkg.name, pkg.newVersion]),
  );
  const required = [];
  for (const pkg of packages) {
    if (proposed.has(pkg.name)) continue;
    for (const [dependencyName, range] of Object.entries(
      pkg.manifest.dependencies || {},
    )) {
      const dependencyVersion = proposed.get(dependencyName);
      if (dependencyVersion && !semver.satisfies(dependencyVersion, range)) {
        required.push(pkg.name);
        break;
      }
    }
  }
  return required.sort();
}

async function registryMetadata(name, fetchImpl = globalThis.fetch) {
  let response;
  try {
    response = await fetchImpl(`${registry}${encodeURIComponent(name)}`, {
      headers: { accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    fail(`npm registry request failed for ${name}: ${error.message}`);
  }
  if (response.status === 404) return undefined;
  if (!response.ok)
    fail(`npm registry returned HTTP ${response.status} for ${name}.`);
  return response.json();
}

async function buildBootstrapPackages(packages, options = {}) {
  const currentHead = options.head || headSha(options.cwd || rootDir);
  const items = [];
  for (const pkg of packages) {
    const metadata = await registryMetadata(pkg.name, options.fetchImpl);
    const published = metadata?.versions?.[pkg.version];
    const registryVersions = Object.keys(metadata?.versions || {}).filter((v) =>
      semver.valid(v),
    );
    if (
      !published &&
      registryVersions.some((publishedVersion) =>
        semver.gte(publishedVersion, pkg.version),
      )
    ) {
      fail(
        `${pkg.name}@${pkg.version} is missing, but npm already has an equal or newer line; bootstrap will not backfill historical versions.`,
      );
    }
    const latest = metadata?.['dist-tags']?.latest;
    if (published && latest && latest !== pkg.version) {
      fail(
        `${pkg.name} manifest is ${pkg.version}, but npm latest is ${latest}; restore the current published baseline before bootstrap.`,
      );
    }
    let target = published?.gitHead || currentHead;
    // When source files haven't changed between the npmjs-recorded commit
    // and HEAD, anchor the tag at HEAD. This prevents administrative commits
    // (version bumps and their reverts) from becoming spurious semantic
    // changes, ensuring a normal release immediately after bootstrap selects
    // zero packages.
    if (
      published?.gitHead &&
      published.gitHead !== currentHead &&
      !sourceFilesChanged(
        published.gitHead,
        currentHead,
        pkg,
        options.cwd || rootDir,
        pkg.version,
      )
    ) {
      target = currentHead;
    }
    if (published && !published.gitHead)
      fail(
        `${pkg.name}@${pkg.version} has no npm gitHead; baseline tag target is unknowable.`,
      );
    const targetExists = options.commitExists || commitExists;
    if (!targetExists(target, options.cwd || rootDir)) {
      fail(
        `${pkg.name}@${pkg.version} baseline commit ${target} is not present in the complete repository history.`,
      );
    }
    const readPackageAtCommit =
      options.packageAtCommit || packageManifestAtCommit;
    const sourceManifest = readPackageAtCommit(
      pkg,
      target,
      options.cwd || rootDir,
    );
    if (
      sourceManifest?.name !== pkg.name ||
      sourceManifest?.version !== pkg.version
    ) {
      fail(
        `${pkg.name}@${pkg.version} does not exist with that identity at baseline commit ${target}.`,
      );
    }
    if (!published) {
      const fixedBaseline = readPackageAtCommit(
        pkg,
        'v2.2.0',
        options.cwd || rootDir,
      );
      if (
        fixedBaseline?.name === pkg.name &&
        fixedBaseline?.version === pkg.version
      ) {
        fail(
          `${pkg.name}@${pkg.version} existed in the historical v2.2.0 release but is absent from npmjs; automated source rebuild is forbidden. Mirror the exact historical artifact instead.`,
        );
      }
    }
    const artifact = published
      ? await (options.verifyArtifact || verifyRegistryArtifact)(
          pkg,
          published,
          options,
        )
      : undefined;
    const tag = packageTag(pkg.name, pkg.version);
    const existing = (options.getTagCommit || tagCommit)(
      tag,
      options.cwd || rootDir,
    );
    if (existing && existing !== target)
      fail(`${tag} points to ${existing}, expected ${target}.`);
    items.push({
      name: pkg.name,
      oldVersion: pkg.version,
      newVersion: pkg.version,
      tag,
      tagTarget: target,
      tagAction: existing ? 'keep' : 'create',
      npmAction: published ? 'skip-existing' : 'publish',
      previouslyPublished: Boolean(published),
      sourceRegistry: registry,
      recordedGitHead: published?.gitHead,
      commitContainsPackage: true,
      artifactSource: published
        ? artifact.tarball
        : `git:${target}:${pkg.relativeDir}`,
      artifactIntegrity: artifact?.integrity,
      artifactShasum: artifact?.shasum,
      tagTiming: published
        ? 'existing-artifact-verified'
        : 'after-successful-publish',
      githubRelease: undefined,
    });
  }
  return items;
}

function planHash(plan) {
  const copy = { ...plan };
  delete copy.integrity;
  return crypto.createHash('sha256').update(JSON.stringify(copy)).digest('hex');
}

async function createPlan(input, options = {}) {
  const cwd = options.cwd || rootDir;
  if (options.checkClean !== false) assertCleanTree(cwd);
  const validatedHead = options.head || headSha(cwd);
  const { installedLerna, installedPreset, packages } =
    verifyConfiguration(cwd);
  const inputs = normalizeInputs(input);
  const branch =
    options.branch ||
    run('git', ['branch', '--show-current'], { cwd }).stdout.trim();
  if (branch !== 'main')
    fail(
      `Release planning is allowed only from main, not ${branch || '(detached)'}.`,
    );
  let relevant = packages.map((pkg) => pkg.name);
  let plannedPackages;
  let forcedDependents = [];
  let commandOptions = {};

  if (inputs.operation === 'bootstrap') {
    commandOptions = { gitHead: validatedHead };
    plannedPackages = await buildBootstrapPackages(packages, {
      ...options,
      cwd,
      head: validatedHead,
    });
  } else {
    for (const pkg of packages) {
      if (!tagCommit(packageTag(pkg.name, pkg.version), cwd)) {
        fail(
          `Missing baseline tag ${packageTag(pkg.name, pkg.version)}; run bootstrap first.`,
        );
      }
    }

    if (!inputs.coordinatedMajor && inputs.operation === 'release') {
      relevant = validateReleaseSignals(packages, cwd);
    }

    if (inputs.operation === 'graduate') {
      const prereleaseNames = packages
        .filter((pkg) => semver.prerelease(pkg.version))
        .map((pkg) => pkg.name);
      if (prereleaseNames.length === 0)
        fail('Graduation requires at least one prerelease package.');
      if (
        inputs.coordinatedMajor &&
        prereleaseNames.length !== packages.length
      ) {
        fail(
          'Coordinated graduation requires every publishable package to be on the coordinated prerelease line.',
        );
      }
      if (inputs.coordinatedMajor) coordinatedTagCommit(packages, cwd);
      else commandOptions = { graduatePackages: prereleaseNames };
    }

    if (
      inputs.coordinatedMajor &&
      inputs.operation === 'release' &&
      inputs.channel === 'beta'
    ) {
      if (packages.some((pkg) => semver.prerelease(pkg.version))) {
        fail('Coordinated beta must start from stable package versions.');
      }
    }
    if (
      inputs.coordinatedMajor &&
      inputs.operation === 'release' &&
      inputs.channel === 'rc'
    ) {
      if (
        packages.some((pkg) => semver.prerelease(pkg.version)?.[0] !== 'beta')
      ) {
        fail(
          'Coordinated RC must continue the already-started coordinated beta versions.',
        );
      }
      coordinatedTagCommit(packages, cwd);
    }
    if (
      !inputs.coordinatedMajor &&
      inputs.operation === 'release' &&
      inputs.channel === 'stable'
    ) {
      const accidental = packages.filter(
        (pkg) => relevant.includes(pkg.name) && semver.prerelease(pkg.version),
      );
      if (accidental.length > 0)
        fail(
          'Stable release cannot implicitly graduate prereleases; use operation=graduate.',
        );
    }

    if (!inputs.coordinatedMajor && inputs.operation === 'release') {
      const simulate = options.simulate || simulateLernaVersions;
      const directCommand = buildReleaseCommand(inputs, commandOptions);
      plannedPackages = simulate(directCommand.args, cwd);
      if (inputs.channel === 'stable') {
        for (;;) {
          const additions = requiredDependents(
            packages,
            plannedPackages,
          ).filter((name) => !forcedDependents.includes(name));
          if (additions.length === 0) break;
          forcedDependents = [...forcedDependents, ...additions].sort();
          commandOptions = {
            forcePackages: forcedDependents,
          };
          const finalCommand = buildReleaseCommand(inputs, commandOptions);
          plannedPackages = simulate(finalCommand.args, cwd);
        }
        const unresolved = requiredDependents(packages, plannedPackages);
        if (unresolved.length > 0) {
          fail(
            `Lerna plan leaves incompatible internal dependents: ${unresolved.join(', ')}.`,
          );
        }
      }
    } else {
      const command = buildReleaseCommand(inputs, commandOptions);
      plannedPackages = (options.simulate || simulateLernaVersions)(
        command.args,
        cwd,
      );
    }
  }

  const command = buildReleaseCommand(inputs, commandOptions);
  const plan = {
    schemaVersion: 1,
    headSha: validatedHead,
    branch,
    lernaVersion: installedLerna,
    changelogPresetVersion: installedPreset,
    registry,
    inputs,
    distTag: command.distTag,
    forcedDependents,
    relevantPackages: relevant,
    packages: plannedPackages,
    noChanges: plannedPackages.length === 0,
    command: {
      executable: 'npx lerna',
      args: command.args,
    },
  };
  if (inputs.operation !== 'bootstrap') assertPlanInvariants(plan, packages);
  plan.integrity = planHash(plan);
  return plan;
}

function validatePlanFile(plan) {
  if (plan.schemaVersion !== 1) fail('Unsupported release plan schema.');
  if (plan.integrity !== planHash(plan))
    fail('Release plan integrity check failed.');
  normalizeInputs(plan.inputs);
  return plan;
}

function printPlan(plan) {
  console.log(`HEAD: ${plan.headSha}`);
  console.log(`Lerna: ${plan.lernaVersion} (independent)`);
  console.log(`Conventional Commits preset: ${plan.changelogPresetVersion}`);
  console.log(`Operation: ${plan.inputs.operation}`);
  console.log(`Channel: ${plan.inputs.channel}`);
  console.log(`Coordinated major: ${plan.inputs.coordinatedMajor}`);
  console.log(`npm dist-tag: ${plan.distTag}`);
  console.log(
    `Command: ${plan.command.executable} ${plan.command.args.join(' ')}`,
  );
  if (plan.noChanges) {
    console.log('No packages selected; release is a successful no-op.');
    return;
  }
  console.table(
    plan.packages.map((pkg) => ({
      package: pkg.name,
      old: pkg.oldVersion,
      proposed: pkg.newVersion,
      npm: pkg.npmAction || 'publish',
      gitTag: pkg.tag,
      githubRelease: pkg.githubRelease || '(baseline tag only)',
    })),
  );
}

function printBaselinePlan(items) {
  console.table(
    items.map((pkg) => ({
      package: pkg.name,
      manifest: pkg.newVersion,
      published: pkg.previouslyPublished ? 'yes' : 'no',
      registry: pkg.sourceRegistry,
      gitHead: pkg.recordedGitHead || '(publish commit)',
      containsPackage: pkg.commitContainsPackage ? 'yes' : 'no',
      baselineTag: pkg.tag,
      artifactSource: pkg.artifactSource,
      tagTiming: pkg.tagTiming,
    })),
  );
}

function verifyHead(expected, options = {}) {
  const cwd = options.cwd || rootDir;
  if (options.checkClean !== false) assertCleanTree(cwd);
  const local = headSha(cwd);
  if (local !== expected)
    fail(`HEAD changed after validation: expected ${expected}, got ${local}.`);
  const branch = run('git', ['branch', '--show-current'], {
    cwd,
  }).stdout.trim();
  if (branch !== 'main')
    fail(`Releases are allowed only from main, not ${branch || '(detached)'}.`);
  if (options.checkRemote !== false) {
    const remote = run(
      'git',
      ['ls-remote', '--heads', 'origin', 'refs/heads/main'],
      { cwd },
    ).stdout.trim();
    const remoteSha = remote.split(/\s+/)[0];
    if (remoteSha !== expected)
      fail(
        `origin/main changed after validation: expected ${expected}, got ${remoteSha || '(missing)'}.`,
      );
    run('git', ['push', '--dry-run', 'origin', 'HEAD:main'], { cwd });
  }
}

function createBootstrapTags(plan, options = {}) {
  const cwd = options.cwd || rootDir;
  const packageNames = options.packageNames
    ? new Set(options.packageNames)
    : undefined;
  const created = [];
  for (const pkg of plan.packages) {
    if (packageNames && !packageNames.has(pkg.name)) continue;
    const existing = tagCommit(pkg.tag, cwd);
    if (existing && existing !== pkg.tagTarget)
      fail(`${pkg.tag} moved after planning.`);
    if (!existing) {
      run(
        'git',
        ['tag', '-a', pkg.tag, pkg.tagTarget, '-m', `Baseline ${pkg.tag}`],
        { cwd },
      );
      created.push(pkg.tag);
    }
  }
  if (created.length > 0 && options.push !== false)
    run('git', ['push', 'origin', ...created], { cwd, inherit: true });
  return created;
}

async function executePlan(plan, options = {}) {
  validatePlanFile(plan);
  verifyHead(plan.headSha, options);
  if (plan.noChanges) {
    console.log('No packages selected; nothing to publish.');
    return;
  }
  if (plan.inputs.operation === 'bootstrap') {
    if (options.checkRemote !== false) {
      run('git', ['fetch', '--tags', '--force', 'origin'], {
        cwd: options.cwd || rootDir,
      });
    }
    const refreshed = await buildBootstrapPackages(
      discoverPackages(options.cwd || rootDir),
      {
        cwd: options.cwd || rootDir,
        head: plan.headSha,
        fetchImpl: options.fetchImpl,
      },
    );
    const expected = plan.packages.map((pkg) => ({
      name: pkg.name,
      version: pkg.newVersion,
      tagTarget: pkg.tagTarget,
      npmAction: pkg.npmAction,
      recordedGitHead: pkg.recordedGitHead,
      artifactIntegrity: pkg.artifactIntegrity,
    }));
    const actual = refreshed.map((pkg) => ({
      name: pkg.name,
      version: pkg.newVersion,
      tagTarget: pkg.tagTarget,
      npmAction: pkg.npmAction,
      recordedGitHead: pkg.recordedGitHead,
      artifactIntegrity: pkg.artifactIntegrity,
    }));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      fail(
        'npm or baseline tag state changed after bootstrap approval; generate a new plan.',
      );
    }
    const existingNames = plan.packages
      .filter((pkg) => pkg.npmAction === 'skip-existing')
      .map((pkg) => pkg.name);
    createBootstrapTags(plan, { ...options, packageNames: existingNames });
  }
  run(process.execPath, [lernaCli, ...plan.command.args], {
    cwd: options.cwd || rootDir,
    env: { GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '' },
    inherit: true,
  });
  if (plan.inputs.operation === 'bootstrap') {
    const newNames = plan.packages
      .filter((pkg) => pkg.npmAction === 'publish')
      .map((pkg) => pkg.name);
    if (newNames.length > 0) {
      const published = await buildBootstrapPackages(
        discoverPackages(options.cwd || rootDir),
        {
          cwd: options.cwd || rootDir,
          head: plan.headSha,
          fetchImpl: options.fetchImpl,
          artifactFetchImpl: options.artifactFetchImpl,
        },
      );
      for (const name of newNames) {
        const before = plan.packages.find((pkg) => pkg.name === name);
        const after = published.find((pkg) => pkg.name === name);
        if (
          !after ||
          after.npmAction !== 'skip-existing' ||
          after.tagTarget !== before.tagTarget ||
          after.recordedGitHead !== before.tagTarget
        ) {
          fail(
            `${name} publication did not produce the approved npmjs artifact at ${before.tagTarget}; no baseline tag was created.`,
          );
        }
      }
      createBootstrapTags(
        { ...plan, packages: published },
        { ...options, packageNames: newNames },
      );
    }
  }
}

function recoveryCommand(channel = 'stable') {
  if (!['stable', 'beta', 'rc'].includes(channel))
    fail(`Unsupported recovery channel ${channel}.`);
  return [
    'npx',
    'lerna',
    'publish',
    'from-git',
    '--yes',
    '--registry',
    registry,
    '--dist-tag',
    distTagFor(channel),
  ];
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) fail(`Unexpected argument ${key}.`);
    const name = key
      .slice(2)
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--'))
      fail(`${key} requires a value.`);
    options[name] = value;
    index += 1;
  }
  return options;
}

async function main() {
  const command = process.argv[2];
  const options = parseArgs(process.argv.slice(3));
  if (command === 'verify') {
    const result = verifyConfiguration();
    console.log(
      `Verified Lerna ${result.installedLerna}, conventionalcommits preset ${result.installedPreset}, independent mode, and ${result.packages.length} publishable packages.`,
    );
    return;
  }
  if (command === 'baseline') {
    const result = verifyConfiguration();
    const items = await buildBootstrapPackages(result.packages);
    printBaselinePlan(items);
    return;
  }
  if (command === 'plan') {
    const plan = await createPlan({
      operation: options.operation,
      channel: options.channel,
      coordinatedMajor: options.coordinatedMajor,
      confirmation: options.confirmation,
    });
    printPlan(plan);
    if (options.output)
      fs.writeFileSync(
        path.resolve(options.output),
        `${JSON.stringify(plan, null, 2)}\n`,
      );
    return;
  }
  if (command === 'execute') {
    if (!options.plan) fail('execute requires --plan.');
    const plan = validatePlanFile(readJson(path.resolve(options.plan)));
    if (
      process.env.EXPECTED_HEAD_SHA &&
      process.env.EXPECTED_HEAD_SHA !== plan.headSha
    ) {
      fail(
        `Approved plan HEAD ${plan.headSha} does not match workflow HEAD ${process.env.EXPECTED_HEAD_SHA}.`,
      );
    }
    printPlan(plan);
    await executePlan(plan);
    return;
  }
  if (command === 'recovery') {
    console.log(recoveryCommand(options.channel).join(' '));
    return;
  }
  fail('Usage: release-tool.js verify|baseline|plan|execute|recovery');
}

module.exports = {
  ReleaseToolError,
  assertPlanInvariants,
  assertCleanTree,
  bootstrapConfirmation,
  buildBootstrapPackages,
  buildReleaseCommand,
  commitExists,
  coordinatedMajorConfirmation,
  coordinatedTagCommit,
  createBootstrapTags,
  createPlan,
  discoverPackages,
  distTagFor,
  executePlan,
  hasReleaseRelevantCommit,
  isReleaseCommit,
  normalizeInputs,
  packageArtifactFromTarball,
  packageManifestAtCommit,
  packageTag,
  planHash,
  recoveryCommand,
  requiredDependents,
  registry,
  sourceFilesChanged,
  normalizePackageForBootstrap,
  normalizePublishConfigForBootstrap,
  normalizeDevDepFileRefs,
  packageJsonSemanticallyChanged,
  stableBase,
  validatePlanFile,
  verifyRegistryArtifact,
  verifyConfiguration,
  verifyHead,
  versionArgsFromPublish,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
