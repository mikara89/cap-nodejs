'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const semver = require('semver');

const rootDir = path.resolve(__dirname, '..');
const supportedWorkspaces = ['libs/*'];
const dependencySections = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'devDependencies',
];

class WorkspacePackageError extends Error {}

class WorkspaceCommandError extends WorkspacePackageError {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = Number.isInteger(exitCode) && exitCode > 0 ? exitCode : 1;
  }
}

function fail(message) {
  throw new WorkspacePackageError(message);
}

function normalizePath(value) {
  return value.replaceAll('\\', '/');
}

function compareStrings(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(
      `${normalizePath(filePath)} could not be read as JSON: ${error.message}`,
    );
  }
}

function samePatterns(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateWorkspaceConfiguration(cwd) {
  const rootManifestPath = path.join(cwd, 'package.json');
  const lernaPath = path.join(cwd, 'lerna.json');
  const rootManifest = readJson(rootManifestPath);
  const lerna = readJson(lernaPath);

  if (rootManifest.private !== true) {
    fail(
      `${normalizePath(rootManifestPath)} field private must be true; the workspace root must remain private.`,
    );
  }
  if (!samePatterns(rootManifest.workspaces, lerna.packages)) {
    fail(
      `${normalizePath(rootManifestPath)} field workspaces and ${normalizePath(lernaPath)} field packages must match.`,
    );
  }
  if (!samePatterns(rootManifest.workspaces, supportedWorkspaces)) {
    fail(
      'The workspace root must be excluded; npm workspaces and Lerna packages must target only libs/*.',
    );
  }

  return { rootManifest, lerna, patterns: [...supportedWorkspaces] };
}

function validatePackageIdentities(packages, options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const boundary = path.resolve(cwd, 'libs');
  const names = new Map();
  const directories = new Map();

  for (const pkg of packages) {
    const packagePath = normalizePath(
      pkg.manifestPath || pkg.dir || '<unknown package>',
    );
    if (typeof pkg.name !== 'string' || pkg.name.trim() === '') {
      fail(`${packagePath} field name must be a non-empty string.`);
    }
    if (!options.fixture && !pkg.name.startsWith('@mikara89/cap-')) {
      fail(
        `${packagePath} field name has unexpected publishable package ${pkg.name}; expected @mikara89/cap-*.`,
      );
    }
    if (!semver.valid(pkg.version)) {
      fail(
        `${pkg.name} has invalid version ${pkg.version} (${packagePath} field version).`,
      );
    }
    if (pkg.private === true || pkg.manifest?.private === true) {
      fail(
        `${packagePath} field private must not be true for a publishable package.`,
      );
    }

    const declaredRelativeDir = normalizePath(
      pkg.relativeDir || path.relative(cwd, pkg.dir),
    );
    const resolvedDir = path.resolve(cwd, declaredRelativeDir);
    const relativeDir = normalizePath(path.relative(cwd, resolvedDir));
    const relativeToBoundary = path.relative(boundary, resolvedDir);
    if (
      relativeToBoundary.startsWith('..') ||
      path.isAbsolute(relativeToBoundary) ||
      relativeToBoundary === '' ||
      relativeToBoundary.includes(path.sep)
    ) {
      fail(
        `${packagePath} is outside the supported workspace boundary libs/*.`,
      );
    }
    if (path.resolve(pkg.dir) !== resolvedDir) {
      fail(
        `${packagePath} field dir conflicts with normalized relative directory ${relativeDir}.`,
      );
    }
    const expectedManifest = path.join(resolvedDir, 'package.json');
    if (path.resolve(pkg.manifestPath) !== expectedManifest) {
      fail(
        `${packagePath} manifest must be located inside ${normalizePath(relativeDir)}.`,
      );
    }

    const duplicateName = names.get(pkg.name);
    if (duplicateName) {
      fail(
        `${packagePath} field name ${pkg.name} conflicts with ${normalizePath(duplicateName.manifestPath)}.`,
      );
    }
    const duplicateDir = directories.get(relativeDir);
    if (duplicateDir) {
      fail(
        `${packagePath} normalized directory ${relativeDir} conflicts with ${normalizePath(duplicateDir.manifestPath)}.`,
      );
    }
    names.set(pkg.name, pkg);
    directories.set(relativeDir, pkg);
  }
}

function discoverWorkspacePackages(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  validateWorkspaceConfiguration(cwd);
  const libsDir = path.join(cwd, 'libs');
  const packages = [];

  if (!fs.existsSync(libsDir))
    fail(`${normalizePath(libsDir)} does not exist.`);
  for (const entry of fs.readdirSync(libsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(libsDir, entry.name);
    const manifestPath = path.join(dir, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    if (manifest.private === true) continue;
    packages.push({
      name: manifest.name,
      version: manifest.version,
      dir,
      relativeDir: normalizePath(path.relative(cwd, dir)),
      manifestPath,
      manifest,
      private: manifest.private === true,
      internalDependencies: [],
    });
  }

  packages.sort((left, right) =>
    compareStrings(String(left.name || ''), String(right.name || '')),
  );
  validatePackageIdentities(packages, {
    cwd,
    fixture: options.fixture === true,
  });
  return packages;
}

function rangeIncludesVersion(range, version) {
  if (typeof range !== 'string') return false;
  if (range.startsWith('workspace:')) {
    const workspaceRange = range.slice('workspace:'.length);
    if (workspaceRange === '*' || workspaceRange === '') return true;
    if (workspaceRange === '^') return semver.satisfies(version, `^${version}`);
    if (workspaceRange === '~') return semver.satisfies(version, `~${version}`);
    return (
      Boolean(semver.validRange(workspaceRange)) &&
      semver.satisfies(version, workspaceRange)
    );
  }
  return Boolean(semver.validRange(range)) && semver.satisfies(version, range);
}

function validateFileReference(pkg, dependencyName, range, byName, cwd) {
  if (typeof range !== 'string' || !range.startsWith('file:')) return;
  const referencedDir = path.resolve(pkg.dir, range.slice('file:'.length));
  const manifestPath = path.join(referencedDir, 'package.json');
  const target = byName.get(dependencyName);
  if (
    !target ||
    !fs.existsSync(manifestPath) ||
    path.resolve(target.dir) !== referencedDir
  ) {
    fail(
      `${normalizePath(pkg.manifestPath)} field dependency ${dependencyName}@${range} references a missing workspace target.`,
    );
  }
}

function buildWorkspaceGraph(packages, options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const dependencies = new Map(packages.map((pkg) => [pkg.name, new Set()]));
  const dependents = new Map(packages.map((pkg) => [pkg.name, new Set()]));

  for (const pkg of packages) {
    for (const section of dependencySections) {
      for (const [name, range] of Object.entries(pkg.manifest[section] || {})) {
        validateFileReference(pkg, name, range, byName, cwd);
        const target = byName.get(name);
        if (!target) continue;
        const fileReference =
          typeof range === 'string' && range.startsWith('file:');
        if (
          options.validateRanges !== false &&
          !fileReference &&
          !rangeIncludesVersion(range, target.version)
        ) {
          fail(
            `${normalizePath(pkg.manifestPath)} field ${section}.${name} range ${range} does not include ${target.version}.`,
          );
        }
        dependencies.get(pkg.name).add(name);
        dependents.get(name).add(pkg.name);
      }
    }
    pkg.internalDependencies = [...dependencies.get(pkg.name)].sort(
      compareStrings,
    );
  }

  const state = new Map();
  const stack = [];
  function visit(name) {
    if (state.get(name) === 'done') return;
    if (state.get(name) === 'visiting') {
      const start = stack.indexOf(name);
      fail(
        `Workspace dependency cycle detected: ${[...stack.slice(start), name].join(' -> ')}`,
      );
    }
    state.set(name, 'visiting');
    stack.push(name);
    for (const dependency of [...dependencies.get(name)].sort(compareStrings))
      visit(dependency);
    stack.pop();
    state.set(name, 'done');
  }
  for (const name of [...byName.keys()].sort(compareStrings)) visit(name);

  return { byName, dependencies, dependents };
}

function sortWorkspacePackages(packages, options = {}) {
  const graph = options.graph || buildWorkspaceGraph(packages, options);
  const indegree = new Map(
    packages.map((pkg) => [pkg.name, graph.dependencies.get(pkg.name).size]),
  );
  const ready = packages
    .filter((pkg) => indegree.get(pkg.name) === 0)
    .map((pkg) => pkg.name)
    .sort(compareStrings);
  const ordered = [];
  while (ready.length > 0) {
    const name = ready.shift();
    ordered.push(graph.byName.get(name));
    for (const dependent of [...graph.dependents.get(name)].sort(
      compareStrings,
    )) {
      indegree.set(dependent, indegree.get(dependent) - 1);
      if (indegree.get(dependent) === 0) {
        ready.push(dependent);
        ready.sort(compareStrings);
      }
    }
  }
  if (ordered.length !== packages.length)
    fail('Workspace dependency graph could not be ordered.');
  return ordered;
}

function validateLockfile(packages, cwd, options = {}) {
  const lockfilePath = path.join(cwd, 'package-lock.json');
  const lockfile = readJson(lockfilePath);
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  for (const pkg of packages) {
    const locked = lockfile.packages?.[pkg.relativeDir];
    if (!locked || locked.version !== pkg.version) {
      fail(`package-lock.json does not match ${pkg.name}@${pkg.version}.`);
    }
    for (const section of dependencySections) {
      for (const [name, range] of Object.entries(pkg.manifest[section] || {})) {
        const target = byName.get(name);
        if (!target) continue;
        if (options.dependenciesOnly === true && section !== 'dependencies') {
          fail(
            `${pkg.name} must declare internal ${name} in dependencies, not ${section}; duplicate/local-only ranges prevent Lerna from updating published ranges.`,
          );
        }
        const fileReference =
          typeof range === 'string' && range.startsWith('file:');
        if (!fileReference && !rangeIncludesVersion(range, target.version)) {
          fail(
            `${pkg.name} internal dependency ${name}@${range} does not include ${target.version}.`,
          );
        }
        if (locked[section]?.[name] !== range) {
          fail(
            `package-lock.json range for ${pkg.name} -> ${name} does not match ${range}.`,
          );
        }
      }
    }
  }
  return lockfile;
}

function validateWorkspacePackages(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const packages =
    options.packages ||
    discoverWorkspacePackages({ cwd, fixture: options.fixture });
  validatePackageIdentities(packages, {
    cwd,
    fixture: options.fixture === true,
  });
  if (packages.length === 0) fail('No publishable packages were discovered.');
  const graph = buildWorkspaceGraph(packages, {
    cwd,
    validateRanges: options.validateRanges !== false,
  });
  if (options.requireBuild !== false) {
    for (const pkg of packages) {
      if (
        typeof pkg.manifest.scripts?.build !== 'string' ||
        pkg.manifest.scripts.build.trim() === ''
      ) {
        fail(
          `${normalizePath(pkg.manifestPath)} field scripts.build is required for publishable package ${pkg.name}.`,
        );
      }
    }
  }
  if (options.validateLockfile !== false) {
    validateLockfile(packages, cwd, {
      dependenciesOnly: options.dependenciesOnly === true,
    });
  }
  return {
    packages,
    graph,
    orderedPackages: sortWorkspacePackages(packages, { graph, cwd }),
  };
}

function selectWorkspacePackages(validation, packageNames) {
  if (!Array.isArray(packageNames))
    fail('Selected packages must be provided as an array of package names.');
  const names = [...new Set(packageNames)];
  for (const name of names) {
    if (typeof name !== 'string' || name.trim() === '')
      fail('Selected package names must be non-empty strings.');
    if (!validation.graph.byName.has(name))
      fail(`Unknown publishable workspace package ${name}.`);
  }
  const selected = new Set(names);
  return validation.orderedPackages.filter((pkg) => selected.has(pkg.name));
}

function readPackageSelection(filePath, field) {
  const resolved = path.resolve(filePath);
  const value = readJson(resolved);
  const selected = Array.isArray(value) ? value : value?.[field];
  if (!Array.isArray(selected)) {
    fail(
      `${normalizePath(resolved)} must contain an array or an array field ${field}.`,
    );
  }
  return selected;
}

function defaultCommandRunner(command, args, options) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    stdio: options.stdio || 'inherit',
  });
}

function npmInvocation(args) {
  const npmCli = [
    process.env.npm_execpath,
    path.join(
      path.dirname(process.execPath),
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    ),
  ]
    .filter(Boolean)
    .find((candidate) => fs.existsSync(candidate));
  if (npmCli) return { command: process.execPath, args: [npmCli, ...args] };
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd', ...args],
    };
  }
  return { command: 'npm', args };
}

function runCommandForPackage(pkg, command, args, options) {
  const runner = options.runner || defaultCommandRunner;
  const env = { ...process.env, ...(options.env || {}) };
  const result = runner(command, args, {
    cwd: options.cwd,
    env,
    stdio: options.stdio || 'inherit',
    package: pkg,
  });
  if (result?.error) {
    throw new WorkspaceCommandError(
      `${pkg.name} (${pkg.relativeDir}) failed to start: ${result.error.message}.`,
    );
  }
  if (result?.status !== 0) {
    throw new WorkspaceCommandError(
      `${pkg.name} (${pkg.relativeDir}) failed with exit ${result?.status ?? 'unknown'}.`,
      result?.status,
    );
  }
}

function runWorkspaceScript(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const script = options.script;
  if (typeof script !== 'string' || script.trim() === '')
    fail('run requires --script <name>.');
  const validation = options.packages
    ? validateWorkspacePackages({
        cwd,
        packages: options.packages,
        fixture: options.fixture,
        validateLockfile: options.validateLockfile ?? false,
      })
    : validateWorkspacePackages({ cwd, fixture: options.fixture });
  const orderedPackages = options.packageNames
    ? selectWorkspacePackages(validation, options.packageNames)
    : validation.orderedPackages;
  for (const pkg of orderedPackages) {
    if (
      typeof pkg.manifest.scripts?.[script] !== 'string' ||
      pkg.manifest.scripts[script].trim() === ''
    ) {
      fail(
        `${normalizePath(pkg.manifestPath)} field scripts.${script} is required for publishable package ${pkg.name}.`,
      );
    }
    const invocation = npmInvocation(['run', script, '--workspace', pkg.name]);
    runCommandForPackage(pkg, invocation.command, invocation.args, {
      ...options,
      cwd,
    });
  }
  return orderedPackages;
}

function packWorkspacePackages(options = {}) {
  if (options.dryRun !== true) fail('pack currently requires --dry-run.');
  const cwd = path.resolve(options.cwd || rootDir);
  const validation = options.packages
    ? validateWorkspacePackages({
        cwd,
        packages: options.packages,
        fixture: options.fixture,
        requireBuild: options.requireBuild ?? false,
        validateLockfile: options.validateLockfile ?? false,
      })
    : validateWorkspacePackages({ cwd, fixture: options.fixture });
  const orderedPackages = options.packageNames
    ? selectWorkspacePackages(validation, options.packageNames)
    : validation.orderedPackages;
  for (const pkg of orderedPackages) {
    const invocation = npmInvocation([
      'pack',
      '--dry-run',
      ...(options.ignoreScripts === true ? ['--ignore-scripts'] : []),
      '--workspace',
      pkg.name,
    ]);
    runCommandForPackage(pkg, invocation.command, invocation.args, {
      ...options,
      cwd,
    });
  }
  return orderedPackages;
}

function usage() {
  return `Usage: workspace-packages.js <command> [options]\n\nCommands:\n  list [--json]       List publishable workspace packages\n  verify              Validate workspace metadata, graph, scripts, and lockfile\n  run --script <name> [--packages-file <file>] [--packages-field <field>]\n                      Run a package script in dependency-first order\n  pack --dry-run [--packages-file <file>] [--packages-field <field>]\n                      Dry-run npm packing in dependency-first order\n`;
}

function parseArgs(argv) {
  const [command, ...args] = argv;
  if (!command || command === '--help' || command === '-h')
    return { command: 'help' };
  const options = { command };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--script') options.script = args[++index];
    else if (arg === '--packages-file') options.packagesFile = args[++index];
    else if (arg === '--packages-field') options.packagesField = args[++index];
    else fail(`Unknown option: ${arg}.\n${usage()}`);
  }
  return options;
}

function listPackages(options = {}) {
  const { packages } = validateWorkspacePackages({
    cwd: options.cwd || rootDir,
    fixture: options.fixture,
    validateLockfile: options.validateLockfile,
  });
  if (options.json) {
    return JSON.stringify(
      packages.map((pkg) => ({
        name: pkg.name,
        version: pkg.version,
        relativeDir: pkg.relativeDir,
        internalDependencies: pkg.internalDependencies,
        hasBuildScript: typeof pkg.manifest.scripts?.build === 'string',
      })),
      null,
      2,
    );
  }
  const width = Math.max(...packages.map((pkg) => pkg.name.length)) + 2;
  return packages
    .map((pkg) => `${pkg.name.padEnd(width)}${pkg.relativeDir}`)
    .join('\n');
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.command === 'help') {
    console.log(usage());
    return;
  }
  if (options.command === 'list') {
    console.log(listPackages(options));
    return;
  }
  if (options.command === 'verify') {
    const result = validateWorkspacePackages({
      cwd: rootDir,
      dependenciesOnly: true,
    });
    console.log(
      `Verified ${result.packages.length} publishable packages under libs/*.`,
    );
    return;
  }
  if (options.command === 'run') {
    const packageNames = options.packagesFile
      ? readPackageSelection(
          options.packagesFile,
          options.packagesField || 'buildPackages',
        )
      : undefined;
    runWorkspaceScript({ cwd: rootDir, script: options.script, packageNames });
    return;
  }
  if (options.command === 'pack') {
    const packageNames = options.packagesFile
      ? readPackageSelection(
          options.packagesFile,
          options.packagesField || 'packPackages',
        )
      : undefined;
    packWorkspacePackages({
      cwd: rootDir,
      dryRun: options.dryRun,
      packageNames,
    });
    return;
  }
  fail(`Unknown command: ${options.command}.\n${usage()}`);
}

module.exports = {
  WorkspaceCommandError,
  WorkspacePackageError,
  buildWorkspaceGraph,
  compareStrings,
  discoverWorkspacePackages,
  listPackages,
  normalizePath,
  npmInvocation,
  packWorkspacePackages,
  parseArgs,
  readPackageSelection,
  runWorkspaceScript,
  selectWorkspacePackages,
  sortWorkspacePackages,
  validatePackageIdentities,
  validateWorkspaceConfiguration,
  validateWorkspacePackages,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    if (error instanceof WorkspacePackageError) console.error(error.message);
    else console.error(error.stack || error.message);
    process.exitCode = error.exitCode || 1;
  }
}
