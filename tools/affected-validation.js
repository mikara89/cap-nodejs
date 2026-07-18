'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  WorkspaceCommandError,
  compareStrings,
  normalizePath,
  npmInvocation,
  packWorkspacePackages,
  runWorkspaceScript,
  validateWorkspacePackages,
} = require('./workspace-packages');

const rootDir = path.resolve(__dirname, '..');
const planVersion = 1;
const commandKinds = Object.freeze({
  git: 'git',
  npm: 'npm',
  node: 'node',
});

const globalBuildFiles = new Set([
  'package.json',
  'package-lock.json',
  'lerna.json',
  'nx.json',
  'nest-cli.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'tools/workspace-packages.js',
]);
const lintConfigurationFiles = new Set([
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  'tsconfig.eslint.json',
]);
const jestConfigurationFiles = new Set([
  'jest.config.js',
  'jest.config.cjs',
  'jest.config.mjs',
]);
const documentationConfigurationFiles = new Set([
  'typedoc.json',
  'tsconfig.typedoc.json',
]);
const releaseFiles = new Set([
  '.github/workflows/release.yml',
  'tools/release-tool.js',
  'tools/release-tool.test.js',
  'tools/package-owned-changelog-preset.js',
  'docs/release.md',
]);
const ciFiles = new Set([
  '.github/workflows/ci.yml',
  'tools/affected-validation.js',
  'tools/affected-validation.test.js',
  'tools/verify-workflow-actions.js',
  'tools/verify-workflow-actions.test.js',
  'tools/workspace-packages.test.js',
]);
const packSmokeTools = new Map([
  ['tools/verify-rabbitmq-pack.js', 'rabbitmqPackSmoke'],
  ['tools/verify-kafka-pack.js', 'kafkaPackSmoke'],
  ['tools/verify-aws-sns-sqs-pack.js', 'awsPackSmoke'],
  ['tools/verify-storage-nest-packs.js', 'storageNestPackSmoke'],
  ['tools/verify-dashboard-isolation.js', 'dashboardIsolationSmoke'],
]);
const storagePackageNames = new Set([
  '@mikara89/cap-storage-knex',
  '@mikara89/cap-storage-mikro-orm',
  '@mikara89/cap-storage-prisma',
  '@mikara89/cap-storage-typeorm',
]);
const storageNestSmokePackageNames = new Set([
  '@mikara89/cap-storage-knex',
  '@mikara89/cap-storage-prisma',
  '@mikara89/cap-storage-typeorm',
]);
const frameworkAndTransportPackages = new Set([
  '@mikara89/cap-core',
  '@mikara89/cap-nest',
  '@mikara89/cap-express',
  '@mikara89/cap-transport-aws-sns-sqs',
  '@mikara89/cap-transport-azure-servicebus',
  '@mikara89/cap-transport-kafka',
  '@mikara89/cap-transport-nestjs-microservices',
  '@mikara89/cap-transport-rabbitmq',
]);
const testingPackageName = '@mikara89/cap-testing';

class AffectedValidationError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = Number.isInteger(exitCode) && exitCode > 0 ? exitCode : 1;
  }
}

class AffectedCommandError extends AffectedValidationError {}

function fail(message) {
  throw new AffectedValidationError(message);
}

function resolveCommandInvocation(kind, args, options = {}) {
  if (!Array.isArray(args))
    throw new AffectedValidationError(
      `Arguments for command kind ${String(kind)} must be an array.`,
    );
  const invocationArgs = [...args];
  switch (kind) {
    case commandKinds.git:
      return { command: 'git', args: invocationArgs };
    case commandKinds.node:
      return {
        command: process.execPath,
        args: invocationArgs,
      };
    case commandKinds.npm: {
      const npmResolver = options.npmResolver || npmInvocation;
      const invocation = npmResolver(invocationArgs);
      if (
        !invocation ||
        typeof invocation.command !== 'string' ||
        !Array.isArray(invocation.args)
      )
        throw new AffectedValidationError(
          'The repository npm resolver returned an invalid invocation.',
        );
      if (invocation.command === process.execPath)
        return {
          command: process.execPath,
          args: [...invocation.args],
        };
      const platform = options.platform || process.platform;
      if (platform !== 'win32' && invocation.command === 'npm')
        return { command: 'npm', args: [...invocation.args] };
      throw new AffectedValidationError(
        `Unsupported npm executable resolution: ${invocation.command}.`,
      );
    }
    default:
      throw new AffectedValidationError(
        `Unsupported command kind: ${String(kind)}.`,
      );
  }
}

function createCommandInvocation(kind, args, options = {}) {
  const resolved = resolveCommandInvocation(kind, args, options);
  return {
    kind,
    command: resolved.command,
    args: resolved.args,
    cwd: options.cwd || rootDir,
    env: { ...process.env, ...(options.env || {}) },
    encoding: options.encoding,
    stdio: options.stdio || (options.encoding ? 'pipe' : 'inherit'),
    shell: false,
    gate: options.gate || kind,
  };
}

function defaultCommandRunner(invocation) {
  const options = {
    cwd: invocation.cwd,
    env: invocation.env,
    encoding: invocation.encoding,
    stdio: invocation.stdio,
    shell: false,
  };
  if (invocation.kind === commandKinds.git && invocation.command === 'git')
    return spawnSync('git', invocation.args, options);
  if (
    invocation.kind === commandKinds.node &&
    invocation.command === process.execPath
  )
    return spawnSync(process.execPath, invocation.args, options);
  if (invocation.kind === commandKinds.npm) {
    if (invocation.command === process.execPath)
      return spawnSync(process.execPath, invocation.args, options);
    if (invocation.command === 'npm')
      return spawnSync('npm', invocation.args, options);
  }
  throw new AffectedValidationError(
    `Unsupported resolved executable for command kind ${String(invocation.kind)}.`,
  );
}

function invoke(kind, args, options = {}) {
  const invocation = createCommandInvocation(kind, args, options);
  const runner = options.runner || defaultCommandRunner;
  const result = runner(invocation);
  if (result?.error) {
    throw new AffectedCommandError(
      `${invocation.gate} failed to start: ${result.error.message}.`,
    );
  }
  if (result?.status !== 0 && options.allowFailure !== true) {
    throw new AffectedCommandError(
      `${invocation.gate} failed with exit ${result?.status ?? 'unknown'}.`,
      result?.status,
    );
  }
  return result || { status: 0, stdout: '', stderr: '' };
}

function git(args, options = {}) {
  return invoke(commandKinds.git, args, {
    ...options,
    encoding: 'utf8',
    stdio: 'pipe',
    gate: options.gate || `git ${args[0]}`,
  });
}

function normalizeChangedPath(value) {
  return normalizePath(String(value))
    .replace(/^\.\//u, '')
    .replace(/\/{2,}/gu, '/')
    .replace(/^\/+|\/+$/gu, '');
}

function stableUnique(values) {
  return [...new Set(values)].sort(compareStrings);
}

function resolveCommit(ref, options = {}) {
  if (typeof ref !== 'string' || ref.trim() === '')
    fail('Both --base and --head must name Git commits.');
  const result = git(['rev-parse', '--verify', `${ref}^{commit}`], {
    cwd: options.cwd,
    runner: options.gitRunner,
    allowFailure: true,
  });
  if (result.status !== 0)
    fail(`Git commit ${ref} does not exist in the checked-out repository.`);
  return result.stdout.trim();
}

function resolveComparison(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const baseSha = resolveCommit(options.base, {
    cwd,
    gitRunner: options.gitRunner,
  });
  const headSha = resolveCommit(options.head, {
    cwd,
    gitRunner: options.gitRunner,
  });
  const mergeBaseResult = git(['merge-base', baseSha, headSha], {
    cwd,
    runner: options.gitRunner,
    allowFailure: true,
  });
  if (mergeBaseResult.status !== 0 || !mergeBaseResult.stdout.trim()) {
    fail(`Git commits ${baseSha} and ${headSha} do not have a merge base.`);
  }
  const comparisonBaseSha = mergeBaseResult.stdout.trim();
  const diff = git(
    [
      'diff',
      '--name-only',
      '--no-renames',
      '--diff-filter=ACDMRTUXB',
      comparisonBaseSha,
      headSha,
      '--',
    ],
    { cwd, runner: options.gitRunner },
  );
  const changedFiles = stableUnique(
    diff.stdout.split(/\r?\n/u).map(normalizeChangedPath).filter(Boolean),
  );
  return {
    baseSha,
    headSha,
    comparisonBaseSha,
    comparisonRange: `${comparisonBaseSha}..${headSha}`,
    changedFiles,
  };
}

function packageForPath(file, packages) {
  return packages.find(
    (pkg) => file === pkg.relativeDir || file.startsWith(`${pkg.relativeDir}/`),
  );
}

function packageRelativePath(file, pkg) {
  return file.slice(pkg.relativeDir.length).replace(/^\//u, '');
}

function isDocumentationPath(file) {
  return /(^|\/)docs?(\/|$)/iu.test(file) || /\.mdx?$/iu.test(file);
}

function isTestPath(file) {
  const name = file.split('/').pop() || '';
  return (
    /(^|\/)(test|tests|__tests__|fixtures)(\/|$)/u.test(file) ||
    /\.(spec|test)\.[cm]?[jt]sx?$/u.test(name) ||
    /^tsconfig\.(test|spec)\.json$/u.test(name)
  );
}

function isIntegrationTestPath(file) {
  return (
    /[.-]e2e([.-]|$)/iu.test(file) ||
    (/(^|\/)(test|tests)\//iu.test(file) &&
      /[.-]integration([.-]|$)/iu.test(file)) ||
    /(rabbitmq|kafka|aws-sns-sqs|servicebus)[.-]integration/iu.test(file) ||
    /outbox-claim.*integration/iu.test(file)
  );
}

function isBuildConfigurationPath(relative) {
  const name = relative.split('/').pop() || '';
  return /^(tsconfig|tsconfig\.(build|lib))\.json$/u.test(name);
}

function isTestConfigurationPath(relative) {
  const name = relative.split('/').pop() || '';
  return /^tsconfig\.(test|spec|eslint|lint)\.json$/u.test(name);
}

function isPublicApiPath(relative) {
  return (
    relative === 'package.json' ||
    /(^|\/)index\.[cm]?[jt]sx?$/u.test(relative) ||
    /\.d\.[cm]?ts$/u.test(relative) ||
    /(^|\/)exports?(\/|\.)/u.test(relative)
  );
}

function isPackDocumentation(relative) {
  return /(^|\/)(README|CHANGELOG|LICENSE)(\.[^/]*)?$/iu.test(relative);
}

function isDatabaseContractPath(file, pkgName) {
  if (isIntegrationTestPath(file) && /outbox-claim|database|sql/iu.test(file))
    return true;
  if (
    pkgName === '@mikara89/cap-storage-prisma' &&
    /(^|\/)package\.json$/u.test(file)
  )
    return true;
  if (storagePackageNames.has(pkgName)) {
    return (
      !isDocumentationPath(file) &&
      !isTestPath(file) &&
      /(^|\/)(src|prisma)(\/|$)/u.test(file)
    );
  }
  if (pkgName === '@mikara89/cap-testing') {
    return (
      !isTestPath(file) &&
      /storage|publish|received|outbox|claim|lease/iu.test(file)
    );
  }
  if (pkgName === '@mikara89/cap-core') {
    return (
      !isTestPath(file) &&
      /storage|publish|received|outbox|claim|lease|retry/iu.test(file)
    );
  }
  return false;
}

function packageImpact(file, pkg) {
  const relative = packageRelativePath(file, pkg);
  const documentation = isDocumentationPath(relative);
  const test = isTestPath(relative);
  const integrationTest = isIntegrationTestPath(relative);
  const testConfiguration = isTestConfigurationPath(relative);
  const buildConfiguration = isBuildConfigurationPath(relative);
  const runtime =
    !documentation &&
    !test &&
    !testConfiguration &&
    (relative === 'package.json' ||
      relative === '.npmignore' ||
      buildConfiguration ||
      /(^|\/)(src|dist|prisma)(\/|$)/u.test(relative) ||
      /\.[cm]?[jt]sx?$/u.test(relative));
  const unitTest = test && !integrationTest;
  const pack = runtime || isPackDocumentation(relative);
  return {
    relative,
    documentation,
    test,
    integrationTest,
    runtime,
    unitTest,
    build: runtime || test,
    expandDependents: runtime,
    pack,
    publicApi: runtime && isPublicApiPath(relative),
    database: isDatabaseContractPath(file, pkg.name),
  };
}

function transitiveClosure(seeds, edges) {
  const result = new Set(seeds);
  const queue = [...seeds].sort(compareStrings);
  while (queue.length > 0) {
    const name = queue.shift();
    for (const next of [...(edges.get(name) || [])].sort(compareStrings)) {
      if (result.has(next)) continue;
      result.add(next);
      queue.push(next);
      queue.sort(compareStrings);
    }
  }
  return result;
}

function orderedNames(validation, names) {
  const selected = new Set(names);
  return validation.orderedPackages
    .filter((pkg) => selected.has(pkg.name))
    .map((pkg) => pkg.name);
}

function filesRecursively(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', 'generated'].includes(entry.name)) return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesRecursively(target) : [target];
  });
}

function collectWorkspaceImports(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const validation = options.validation;
  const packageNames = validation.packages.map((pkg) => pkg.name);
  const imports = new Set();
  for (const root of stableUnique(options.roots || [])) {
    for (const file of filesRecursively(path.join(cwd, root))) {
      if (!/\.[cm]?[jt]sx?$/u.test(file)) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/['"]([^'"\r\n]+)['"]/gu)) {
        const specifier = match[1];
        const packageName = packageNames.find(
          (name) => specifier === name || specifier.startsWith(`${name}/`),
        );
        if (packageName) imports.add(packageName);
      }
    }
  }
  return imports;
}

function isSupportedUnitTestFile(file) {
  const normalized = normalizePath(file);
  return (
    /\.(spec|test)\.[cm]?[jt]sx?$/u.test(normalized) &&
    !isIntegrationTestPath(normalized)
  );
}

function collectUnitTestFiles(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const roots = stableUnique(options.roots || []);
  return stableUnique(
    roots.flatMap((relative) =>
      filesRecursively(path.join(cwd, relative))
        .filter(isSupportedUnitTestFile)
        .map((file) => normalizePath(path.relative(cwd, file))),
    ),
  );
}

function defaultGates() {
  return {
    packageVerify: true,
    affectedToolTests: true,
    releaseVerify: false,
    releaseToolTests: false,
    legacyNameTests: false,
    lint: true,
    build: false,
    appBuild: false,
    unitTests: false,
    fullUnitTests: false,
    e2e: false,
    databaseIntegration: false,
    examples: false,
    apiDocs: false,
    packageDryRun: false,
    rabbitmqPackSmoke: false,
    kafkaPackSmoke: false,
    awsPackSmoke: false,
    storageNestPackSmoke: false,
    dashboardIsolationSmoke: false,
    workspaceLinks: false,
    capNestTypecheck: false,
    fallowAudit: false,
    fallowHealth: false,
  };
}

function enableCompleteValidation(gates) {
  for (const key of Object.keys(gates)) gates[key] = true;
}

/**
 * CI impact is intentionally distinct from release artifact significance.
 * Release selection asks whether a package artifact needs a new version; this
 * planner asks what can break compilation, tests, integrations, or packing in
 * the current checkout. Test-only files therefore matter here, while package
 * documentation can require a pack check without selecting runtime tests.
 */
function createPlanFromChangedFiles(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const validation =
    options.validation ||
    validateWorkspacePackages({ cwd, fixture: options.fixture === true });
  const packages = validation.packages;
  const changedFiles = stableUnique(
    (options.changedFiles || []).map(normalizeChangedPath).filter(Boolean),
  );
  const directlyAffected = new Set();
  const dependentSeeds = new Set();
  const buildSeeds = new Set();
  const testSeeds = new Set();
  const packSeeds = new Set();
  const testRoots = new Set();
  const reasons = new Set();
  const gates = defaultGates();
  let globalImpact = false;
  let releaseImpact = false;
  let ciImpact = false;
  let appImpact = false;
  let genericPackImpact = false;

  for (const file of changedFiles) {
    const pkg = packageForPath(file, packages);
    if (pkg) {
      const impact = packageImpact(file, pkg);
      directlyAffected.add(pkg.name);
      if (impact.build) buildSeeds.add(pkg.name);
      if (impact.unitTest || impact.runtime) testSeeds.add(pkg.name);
      if (impact.expandDependents) dependentSeeds.add(pkg.name);
      if (impact.pack) packSeeds.add(pkg.name);
      if (impact.unitTest || impact.runtime) testRoots.add(pkg.relativeDir);
      if (impact.database) gates.databaseIntegration = true;
      if (impact.runtime) gates.apiDocs = true;
      if (
        impact.publicApi ||
        (impact.runtime && frameworkAndTransportPackages.has(pkg.name))
      )
        gates.examples = true;
      if (impact.runtime && frameworkAndTransportPackages.has(pkg.name))
        gates.e2e = true;
      if (impact.pack && pkg.name === '@mikara89/cap-transport-rabbitmq')
        gates.rabbitmqPackSmoke = true;
      if (impact.pack && pkg.name === '@mikara89/cap-transport-kafka')
        gates.kafkaPackSmoke = true;
      if (impact.pack && pkg.name === '@mikara89/cap-transport-aws-sns-sqs')
        gates.awsPackSmoke = true;
      const storageNestPath = /(^|\/)src\/nest(\/|$)/u.test(impact.relative);
      if (
        impact.pack &&
        storageNestSmokePackageNames.has(pkg.name) &&
        (impact.relative === 'package.json' || storageNestPath)
      )
        gates.storageNestPackSmoke = true;
      if (
        impact.runtime &&
        storagePackageNames.has(pkg.name) &&
        storageNestPath
      ) {
        gates.examples = true;
        gates.apiDocs = true;
      }
      if (
        impact.runtime &&
        ['@mikara89/cap-core', '@mikara89/cap-dashboard-core'].includes(
          pkg.name,
        )
      )
        gates.dashboardIsolationSmoke = true;
      reasons.add(`${file}: owned by ${pkg.name}`);
      continue;
    }

    if (globalBuildFiles.has(file)) {
      globalImpact = true;
      genericPackImpact = true;
      reasons.add(`${file}: repository-global build or package configuration`);
      continue;
    }
    if (lintConfigurationFiles.has(file)) {
      reasons.add(`${file}: full lint configuration`);
      continue;
    }
    if (jestConfigurationFiles.has(file)) {
      gates.unitTests = true;
      gates.fullUnitTests = true;
      reasons.add(`${file}: full root Jest configuration`);
      continue;
    }
    if (documentationConfigurationFiles.has(file)) {
      gates.apiDocs = true;
      reasons.add(`${file}: API documentation configuration`);
      continue;
    }
    if (releaseFiles.has(file) || file.startsWith('.release/')) {
      releaseImpact = true;
      reasons.add(`${file}: release policy or release workflow`);
      continue;
    }
    if (ciFiles.has(file)) {
      ciImpact = true;
      reasons.add(`${file}: CI or affected-validation policy`);
      continue;
    }
    const smokeGate = packSmokeTools.get(file);
    if (smokeGate) {
      gates[smokeGate] = true;
      reasons.add(`${file}: specialized package smoke tooling`);
      continue;
    }
    if (file.startsWith('apps/')) {
      appImpact = true;
      gates.appBuild = true;
      gates.e2e = true;
      if (isSupportedUnitTestFile(file)) gates.unitTests = true;
      testRoots.add(file.split('/').slice(0, 2).join('/'));
      reasons.add(`${file}: application or e2e input`);
      continue;
    }
    if (file.startsWith('examples/')) {
      gates.examples = true;
      reasons.add(`${file}: executable example input`);
      continue;
    }
    if (file.startsWith('docs/api/') || file.startsWith('docs/reference/')) {
      reasons.add(`${file}: generated or authored documentation`);
      continue;
    }
    if (isDocumentationPath(file)) {
      reasons.add(`${file}: repository documentation only`);
      continue;
    }
    if (
      isIntegrationTestPath(file) &&
      /outbox-claim|database|sql/iu.test(file)
    ) {
      gates.databaseIntegration = true;
      reasons.add(`${file}: database integration input`);
      continue;
    }
    if (file.startsWith('.github/')) {
      ciImpact = true;
      reasons.add(`${file}: repository automation`);
      continue;
    }
    reasons.add(`${file}: administrative root change`);
  }

  if (releaseImpact || ciImpact || globalImpact) {
    gates.releaseVerify = true;
    gates.releaseToolTests = true;
    gates.legacyNameTests = true;
  }

  if (globalImpact) {
    enableCompleteValidation(gates);
    for (const pkg of packages) {
      buildSeeds.add(pkg.name);
      testSeeds.add(pkg.name);
      packSeeds.add(pkg.name);
      testRoots.add(pkg.relativeDir);
    }
  }

  // Affected dry-runs disable lifecycle scripts so package prepack hooks do
  // not rebuild the same package. Build packed packages explicitly through
  // the shared dependency-first orchestrator instead.
  for (const name of packSeeds) buildSeeds.add(name);

  // The root e2e suite compiles the test application against workspace dist
  // declarations. Include every workspace package imported by that app so a
  // clean runner does not depend on declarations left by an earlier build.
  if (gates.e2e) {
    for (const name of collectWorkspaceImports({
      cwd,
      validation,
      roots: ['apps/cap-test-app'],
    }))
      buildSeeds.add(name);
  }

  // Root Jest maps the shared testing package to source, while ts-jest still
  // resolves its types through the workspace dist path. A clean runner must
  // therefore build the testing helper before executing selected unit tests.
  if (testSeeds.size > 0 && validation.graph.byName.has(testingPackageName))
    buildSeeds.add(testingPackageName);

  const expanded = globalImpact
    ? new Set()
    : transitiveClosure(dependentSeeds, validation.graph.dependents);
  const affectedDependents = new Set(
    [...expanded].filter((name) => !directlyAffected.has(name)),
  );
  for (const name of expanded) {
    buildSeeds.add(name);
    testSeeds.add(name);
    const pkg = validation.graph.byName.get(name);
    if (pkg) testRoots.add(pkg.relativeDir);
  }

  const buildClosure = globalImpact
    ? buildSeeds
    : transitiveClosure(buildSeeds, validation.graph.dependencies);
  const buildPackages = orderedNames(validation, buildClosure);
  const testPackages = orderedNames(validation, testSeeds);
  const packPackages = orderedNames(validation, packSeeds);
  const testFiles = collectUnitTestFiles({ cwd, roots: [...testRoots] });

  gates.build = buildPackages.length > 0;
  gates.unitTests = globalImpact || testFiles.length > 0 || gates.unitTests;
  gates.packageDryRun = packPackages.length > 0 || gates.packageDryRun;

  if (genericPackImpact) {
    gates.rabbitmqPackSmoke = true;
    gates.kafkaPackSmoke = true;
    gates.awsPackSmoke = true;
    gates.storageNestPackSmoke = true;
    gates.dashboardIsolationSmoke = true;
  }

  if (changedFiles.length === 0)
    reasons.add('No changed files: retain repository verification and lint.');
  if (appImpact) gates.e2e = true;

  const affectedPackages = orderedNames(
    validation,
    globalImpact
      ? new Set(packages.map((pkg) => pkg.name))
      : new Set([...directlyAffected, ...affectedDependents]),
  );
  return {
    version: planVersion,
    baseSha: options.baseSha || null,
    headSha: options.headSha || null,
    comparisonBaseSha: options.comparisonBaseSha || options.baseSha || null,
    comparisonRange:
      options.comparisonRange ||
      (options.baseSha && options.headSha
        ? `${options.baseSha}..${options.headSha}`
        : null),
    changedFiles,
    directlyAffectedPackages: orderedNames(validation, directlyAffected),
    affectedPackages,
    affectedDependents: orderedNames(validation, affectedDependents),
    buildPackages,
    testPackages,
    packPackages,
    testFiles,
    globalImpact,
    reasons: stableUnique(reasons),
    gates,
  };
}

function createAffectedPlan(options = {}) {
  const comparison = resolveComparison(options);
  return createPlanFromChangedFiles({
    ...options,
    ...comparison,
  });
}

function validatePlan(plan, options = {}) {
  if (!plan || plan.version !== planVersion)
    fail(`Affected plan version must be ${planVersion}.`);
  for (const field of ['changedFiles', 'testFiles', 'reasons']) {
    if (!Array.isArray(plan[field]))
      fail(`Affected plan field ${field} must be an array.`);
    if (
      JSON.stringify(plan[field]) !== JSON.stringify(stableUnique(plan[field]))
    )
      fail(`Affected plan field ${field} must be sorted and unique.`);
  }
  for (const field of [
    'directlyAffectedPackages',
    'affectedPackages',
    'affectedDependents',
    'buildPackages',
    'testPackages',
    'packPackages',
  ]) {
    if (!Array.isArray(plan[field]))
      fail(`Affected plan field ${field} must be an array.`);
    if (new Set(plan[field]).size !== plan[field].length)
      fail(`Affected plan field ${field} must not contain duplicates.`);
  }
  if (!plan.gates || typeof plan.gates !== 'object')
    fail('Affected plan field gates must be an object.');
  const validation =
    options.validation ||
    validateWorkspacePackages({
      cwd: options.cwd || rootDir,
      fixture: options.fixture === true,
    });
  const known = new Set(validation.packages.map((pkg) => pkg.name));
  for (const field of [
    'directlyAffectedPackages',
    'affectedPackages',
    'affectedDependents',
    'buildPackages',
    'testPackages',
    'packPackages',
  ]) {
    for (const name of plan[field]) {
      if (!known.has(name))
        fail(`Affected plan contains unknown package ${name}.`);
    }
    if (
      JSON.stringify(plan[field]) !==
      JSON.stringify(orderedNames(validation, new Set(plan[field])))
    )
      fail(`Affected plan field ${field} must use dependency-first order.`);
  }
  return plan;
}

function gateNames(plan) {
  return Object.entries(plan.gates)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .sort(compareStrings);
}

function formatPlanSummary(plan, statuses = {}) {
  const enabled = gateNames(plan);
  const skipped = Object.keys(plan.gates)
    .filter((name) => !plan.gates[name])
    .sort(compareStrings);
  const display = (values) => (values.length > 0 ? values.join(', ') : 'none');
  const databaseStatus =
    statuses.databaseIntegration ||
    (plan.gates.databaseIntegration ? 'required by plan' : 'not required');
  return [
    '## Affected validation',
    '',
    `- Base SHA: \`${plan.baseSha || 'synthetic'}\``,
    `- Head SHA: \`${plan.headSha || 'synthetic'}\``,
    `- Comparison range: \`${plan.comparisonRange || 'synthetic'}\``,
    `- Changed-file count: ${plan.changedFiles.length}`,
    `- Directly affected packages: ${display(plan.directlyAffectedPackages)}`,
    `- Affected dependents: ${display(plan.affectedDependents)}`,
    `- Build packages: ${display(plan.buildPackages)}`,
    `- Test packages: ${display(plan.testPackages)}`,
    `- Pack packages: ${display(plan.packPackages)}`,
    `- Conditional gates: ${display(enabled)}`,
    `- Database integration: ${databaseStatus}`,
    `- Global escalation: ${plan.globalImpact ? 'yes' : 'no'}`,
    `- Escalation/classification reasons: ${display(plan.reasons)}`,
    `- Skipped expensive gates: ${display(skipped)}`,
    '',
  ].join('\n');
}

function appendSummary(summary, options = {}) {
  const summaryFile = options.summaryFile || process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) fs.appendFileSync(summaryFile, `${summary}\n`);
  if (options.print !== false) console.log(summary);
}

function runNpm(args, context, gate, options = {}) {
  return invoke(commandKinds.npm, args, {
    cwd: context.cwd,
    runner: context.runner,
    gate,
    allowFailure: options.allowFailure,
  });
}

function runNode(args, context, gate) {
  return invoke(commandKinds.node, args, {
    cwd: context.cwd,
    runner: context.runner,
    gate,
  });
}

function adaptInjectedWorkspaceRunner(runner) {
  return (command, args, options = {}) =>
    runner({
      kind: commandKinds.npm,
      command,
      args: [...args],
      cwd: options.cwd || rootDir,
      env: options.env || process.env,
      encoding: options.encoding,
      stdio: options.stdio || 'inherit',
      shell: false,
      gate: options.gate || options.package?.name || commandKinds.npm,
      package: options.package,
    });
}

function runRecordedGate(name, statuses, callback, options = {}) {
  try {
    const result = callback();
    statuses[name] = result?.status === 0 ? 'passed' : 'failed (allowed)';
    return result;
  } catch (error) {
    statuses[name] = 'failed';
    if (options.required === false) return undefined;
    throw error;
  }
}

function batchTestFiles(files, options = {}) {
  const maxFiles = options.maxFiles || 40;
  const maxCharacters = options.maxCharacters || 12_000;
  const batches = [];
  let current = [];
  let characters = 0;
  for (const file of files) {
    if (
      current.length > 0 &&
      (current.length >= maxFiles ||
        characters + file.length + 1 > maxCharacters)
    ) {
      batches.push(current);
      current = [];
      characters = 0;
    }
    current.push(file);
    characters += file.length + 1;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

function runSelectedUnitTests(plan, context) {
  if (plan.testFiles.length === 0) return { status: 0, skipped: true };
  if (plan.testPackages.includes('@mikara89/cap-storage-prisma')) {
    runNpm(
      [
        'run',
        'generate:test-clients',
        '--workspace',
        '@mikara89/cap-storage-prisma',
      ],
      context,
      'generate Prisma test clients',
    );
  }
  const jestCli = path.join(
    context.cwd,
    'node_modules',
    'jest',
    'bin',
    'jest.js',
  );
  for (const files of batchTestFiles(plan.testFiles, context)) {
    runNode(
      [jestCli, '--runTestsByPath', ...files, '--runInBand'],
      context,
      'affected root Jest tests',
    );
  }
  return { status: 0 };
}

function runCompleteValidation(context, statuses) {
  const requiredNpm = (name, args) =>
    runRecordedGate(name, statuses, () => runNpm(args, context, name));
  requiredNpm('packageVerify', ['run', 'packages:verify']);
  requiredNpm('lint', ['run', 'lint:check']);
  requiredNpm('releaseVerify', ['run', 'release:verify']);
  requiredNpm('legacyNameTests', ['run', 'verify:legacy-package-names']);
  requiredNpm('releaseToolTests', ['run', 'test:release-tooling']);
  runRecordedGate(
    'fallowAudit',
    statuses,
    () =>
      runNpm(['run', 'fallow:ci'], context, 'fallowAudit', {
        allowFailure: true,
      }),
    { required: false },
  );
  requiredNpm('fallowHealth', ['run', 'fallow:health:ci']);
  requiredNpm('build', ['run', 'build']);
  requiredNpm('examples', ['run', 'examples:check']);
  requiredNpm('apiDocs', ['run', 'docs:api']);
  requiredNpm('workspaceLinks', ['ls', '--workspaces', '--depth=0']);
  runRecordedGate('capNestTypecheck', statuses, () =>
    runNode(
      [
        path.join(context.cwd, 'node_modules', 'typescript', 'bin', 'tsc'),
        '-p',
        'libs/cap-nest/tsconfig.lib.json',
        '--noEmit',
      ],
      context,
      'capNestTypecheck',
    ),
  );
  requiredNpm('unitTests', ['test', '--silent']);
  requiredNpm('e2e', ['run', 'test:e2e', '--', '--runInBand']);
  requiredNpm('databaseIntegration', ['run', 'test:integration:db']);
  requiredNpm('packageDryRun', ['run', 'pack:dry-run']);
  requiredNpm('rabbitmqPackSmoke', ['run', 'pack:smoke:rabbitmq']);
  requiredNpm('kafkaPackSmoke', ['run', 'pack:smoke:kafka']);
  requiredNpm('awsPackSmoke', ['run', 'pack:smoke:aws-sns-sqs']);
  requiredNpm('storageNestPackSmoke', ['run', 'pack:smoke:storage-nest']);
  requiredNpm('dashboardIsolationSmoke', [
    'run',
    'pack:smoke:dashboard-isolation',
  ]);
}

function runAffectedValidation(plan, options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  const validation = validatePlan(plan, {
    cwd,
    validation: options.validation,
    fixture: options.fixture,
  });
  const statuses = {};
  const context = {
    cwd,
    runner: options.runner || defaultCommandRunner,
    workspaceRunner: options.runner
      ? adaptInjectedWorkspaceRunner(options.runner)
      : undefined,
    maxFiles: options.maxFiles,
    maxCharacters: options.maxCharacters,
  };
  try {
    if (validation.globalImpact) {
      runCompleteValidation(context, statuses);
      return { plan: validation, statuses };
    }

    const npmGate = (name, args) =>
      runRecordedGate(name, statuses, () => runNpm(args, context, name));
    if (validation.gates.packageVerify)
      npmGate('packageVerify', ['run', 'packages:verify']);
    if (validation.gates.affectedToolTests)
      npmGate('affectedToolTests', ['run', 'test:affected-validation']);
    if (validation.gates.releaseVerify)
      npmGate('releaseVerify', ['run', 'release:verify']);
    if (validation.gates.legacyNameTests)
      npmGate('legacyNameTests', ['run', 'verify:legacy-package-names']);
    if (validation.gates.releaseToolTests)
      runRecordedGate('releaseToolTests', statuses, () =>
        runNode(
          ['--test', 'tools/release-tool.test.js'],
          context,
          'releaseToolTests',
        ),
      );
    if (validation.gates.lint) npmGate('lint', ['run', 'lint:check']);
    if (validation.gates.build) {
      runRecordedGate('build', statuses, () => {
        const selectedRunner =
          options.workspaceScriptRunner || runWorkspaceScript;
        selectedRunner({
          cwd,
          script: 'build',
          packageNames: validation.buildPackages,
          ...(context.workspaceRunner
            ? { runner: context.workspaceRunner }
            : {}),
          fixture: options.fixture,
        });
        return { status: 0 };
      });
    }
    if (validation.gates.appBuild)
      runRecordedGate('appBuild', statuses, () =>
        runNode(
          [
            path.join(cwd, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'),
            'build',
            'cap-test-app',
          ],
          context,
          'appBuild',
        ),
      );
    if (validation.gates.examples)
      npmGate('examples', ['run', 'examples:check']);
    if (validation.gates.apiDocs) npmGate('apiDocs', ['run', 'docs:api']);
    if (validation.gates.unitTests) {
      if (validation.gates.fullUnitTests)
        npmGate('unitTests', ['test', '--silent']);
      else
        runRecordedGate('unitTests', statuses, () =>
          runSelectedUnitTests(validation, context),
        );
    }
    if (validation.gates.e2e)
      npmGate('e2e', ['run', 'test:e2e', '--', '--runInBand']);
    if (validation.gates.databaseIntegration)
      npmGate('databaseIntegration', ['run', 'test:integration:db']);
    else statuses.databaseIntegration = 'not required';
    if (validation.gates.packageDryRun && validation.packPackages.length > 0) {
      runRecordedGate('packageDryRun', statuses, () => {
        const selectedPacker = options.workspacePacker || packWorkspacePackages;
        selectedPacker({
          cwd,
          dryRun: true,
          ignoreScripts: true,
          packageNames: validation.packPackages,
          ...(context.workspaceRunner
            ? { runner: context.workspaceRunner }
            : {}),
          fixture: options.fixture,
        });
        return { status: 0 };
      });
    }
    for (const [gate, script] of [
      ['rabbitmqPackSmoke', 'pack:smoke:rabbitmq'],
      ['kafkaPackSmoke', 'pack:smoke:kafka'],
      ['awsPackSmoke', 'pack:smoke:aws-sns-sqs'],
      ['storageNestPackSmoke', 'pack:smoke:storage-nest'],
      ['dashboardIsolationSmoke', 'pack:smoke:dashboard-isolation'],
    ]) {
      if (validation.gates[gate]) npmGate(gate, ['run', script]);
    }
    return { plan: validation, statuses };
  } catch (error) {
    if (!statuses.databaseIntegration)
      statuses.databaseIntegration = validation.gates.databaseIntegration
        ? 'failed or not reached'
        : 'not required';
    appendSummary(formatPlanSummary(validation, statuses), {
      summaryFile: options.summaryFile,
      print: options.printSummary,
    });
    throw error;
  }
}

function usage() {
  return `Usage: affected-validation.js <command> [options]\n\nCommands:\n  plan --base <sha> --head <sha> [--output <file>] [--json]\n  run  (--base <sha> --head <sha> | --plan <file>)\n`;
}

function parseArgs(argv) {
  const [command, ...args] = argv;
  if (!command || command === '--help' || command === '-h')
    return { command: 'help' };
  if (!['plan', 'run'].includes(command))
    fail(`Unknown command ${command}.\n${usage()}`);
  const options = { command };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') options.json = true;
    else if (['--base', '--head', '--output', '--plan'].includes(arg)) {
      const value = args[++index];
      if (!value || value.startsWith('--')) fail(`${arg} requires a value.`);
      options[arg.slice(2)] = value;
    } else fail(`Unknown option ${arg}.\n${usage()}`);
  }
  return options;
}

function readPlan(file) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  } catch (error) {
    fail(
      `Could not read affected plan ${normalizePath(file)}: ${error.message}`,
    );
  }
}

function writePlan(file, plan) {
  fs.writeFileSync(path.resolve(file), `${JSON.stringify(plan, null, 2)}\n`);
}

function main(argv = process.argv.slice(2), options = {}) {
  const parsed = parseArgs(argv);
  if (parsed.command === 'help') {
    console.log(usage());
    return;
  }
  if (parsed.command === 'plan') {
    if (!parsed.base || !parsed.head) fail('plan requires --base and --head.');
    const plan = createAffectedPlan({
      cwd: options.cwd || rootDir,
      base: parsed.base,
      head: parsed.head,
      fixture: options.fixture,
      validation: options.validation,
      gitRunner: options.gitRunner,
    });
    if (parsed.output) writePlan(parsed.output, plan);
    if (parsed.json) console.log(JSON.stringify(plan, null, 2));
    else appendSummary(formatPlanSummary(plan), options);
    return plan;
  }

  if (parsed.plan && (parsed.base || parsed.head))
    fail('run accepts either --plan or --base/--head, not both.');
  let temporaryPlan;
  try {
    let plan;
    if (parsed.plan) plan = readPlan(parsed.plan);
    else {
      if (!parsed.base || !parsed.head)
        fail('run requires --plan or --base and --head.');
      plan = createAffectedPlan({
        cwd: options.cwd || rootDir,
        base: parsed.base,
        head: parsed.head,
        fixture: options.fixture,
        validation: options.validation,
        gitRunner: options.gitRunner,
      });
      temporaryPlan = path.join(
        options.tempDir || os.tmpdir(),
        `cap-affected-${process.pid}-${Date.now()}.json`,
      );
      writePlan(temporaryPlan, plan);
      plan = readPlan(temporaryPlan);
    }
    const result = runAffectedValidation(plan, {
      ...options,
      cwd: options.cwd || rootDir,
    });
    appendSummary(formatPlanSummary(result.plan, result.statuses), options);
    return result;
  } finally {
    if (temporaryPlan) fs.rmSync(temporaryPlan, { force: true });
  }
}

module.exports = {
  AffectedCommandError,
  AffectedValidationError,
  batchTestFiles,
  collectUnitTestFiles,
  commandKinds,
  createCommandInvocation,
  createAffectedPlan,
  createPlanFromChangedFiles,
  formatPlanSummary,
  isDatabaseContractPath,
  isDocumentationPath,
  isIntegrationTestPath,
  isSupportedUnitTestFile,
  isTestPath,
  main,
  normalizeChangedPath,
  packageForPath,
  packageImpact,
  parseArgs,
  resolveCommit,
  resolveCommandInvocation,
  resolveComparison,
  runAffectedValidation,
  runSelectedUnitTests,
  stableUnique,
  transitiveClosure,
  validatePlan,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.exitCode || 1;
  }
}
