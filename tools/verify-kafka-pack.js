'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const packageName = '@mikara89/cap-transport-kafka';
const corePackage = '@mikara89/cap-core';
const coreMinimum = '2.2.0';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for the pack smoke.');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-kafka-pack-'));
const projectDir = path.join(tempDir, 'consumer');

try {
  fs.mkdirSync(projectDir, { recursive: true });
  const packOutput = run(
    process.execPath,
    [
      npmCli,
      'pack',
      '--json',
      '--workspace',
      packageName,
      '--pack-destination',
      tempDir,
    ],
    rootDir,
  );
  const pack = JSON.parse(packOutput.slice(packOutput.indexOf('[')).trim())[0];
  const paths = pack.files.map((file) => normalize(file.path));
  assertIntentionalFiles(paths);
  const forbidden = paths.find(
    (file) =>
      file.startsWith('src/') ||
      /(^|\/)(test|tests|__tests__)(\/|$)/u.test(file) ||
      /\.(spec|test)\.[cm]?[jt]sx?$/u.test(file),
  );
  if (forbidden)
    throw new Error(`Packed archive contains forbidden file ${forbidden}.`);
  for (const required of [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'dist/index.js',
    'dist/index.d.ts',
  ]) {
    if (!paths.includes(required))
      throw new Error(`Packed archive is missing ${required}.`);
  }

  writeJson(path.join(projectDir, 'package.json'), {
    name: 'kafka-pack-smoke',
    private: true,
    version: '0.0.0',
    devDependencies: {
      '@types/node': '^22.0.0',
    },
  });
  run(
    process.execPath,
    [
      npmCli,
      'install',
      '--no-audit',
      '--no-fund',
      '--save-exact',
      path.join(tempDir, pack.filename),
      `${corePackage}@${coreMinimum}`,
    ],
    projectDir,
  );
  run(
    process.execPath,
    [
      '-e',
      [
        `const transport = require(${JSON.stringify(packageName)});`,
        "if (typeof transport.KafkaPublisher !== 'function') process.exit(2);",
        "if (typeof transport.KafkaSubscriber !== 'function') process.exit(3);",
        "require('@confluentinc/kafka-javascript');",
        `const manifest = require(${JSON.stringify(`${packageName}/package.json`)});`,
        `if (manifest.name !== ${JSON.stringify(packageName)}) process.exit(4);`,
        `try { require(${JSON.stringify(`${packageName}/kafka-config`)}); process.exit(5); } catch (error) { if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error; }`,
      ].join(' '),
    ],
    projectDir,
  );

  fs.writeFileSync(
    path.join(projectDir, 'usage.ts'),
    [
      `import type { PublisherPort, SubscriberPort } from '${corePackage}';`,
      `import { KafkaPublisher, KafkaSubscriber, type KafkaOptions } from '${packageName}';`,
      "const options: KafkaOptions = { brokers: ['localhost:9092'], producer: { acks: -1 } };",
      'const publisher = new KafkaPublisher(options);',
      'const subscriber = new KafkaSubscriber(options);',
      'const publisherPort: PublisherPort = publisher;',
      'const subscriberPort: SubscriberPort = subscriber;',
      'void publisherPort;',
      'void subscriberPort;',
      "void publisher.emit('smoke.topic', { ok: true }, undefined, { messageId: 'smoke-1' });",
      "void subscriber.consume('smoke.topic', 'smoke-group', () => undefined);",
      'void publisher.close();',
      'void subscriber.close();',
      '',
    ].join('\n'),
  );
  writeJson(path.join(projectDir, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'commonjs',
      moduleResolution: 'node',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
    },
    include: ['usage.ts'],
  });
  run(
    process.execPath,
    [
      path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      'tsconfig.json',
    ],
    projectDir,
  );

  const installedManifest = readJson(
    path.join(
      projectDir,
      'node_modules',
      '@mikara89',
      'cap-transport-kafka',
      'package.json',
    ),
  );
  assertInstalledManifest(installedManifest);
  assertNoMonorepoLinks(projectDir);
  console.log(
    JSON.stringify(
      {
        package: `${installedManifest.name}@${installedManifest.version}`,
        archive: pack.filename,
        files: paths.length,
        packedBytes: pack.size,
        unpackedBytes: pack.unpackedSize,
        minimumCore: `${corePackage}@${coreMinimum}`,
        nativeInstall: 'passed',
        rootImport: 'passed',
        packageJsonExport: 'passed',
        privateSubpath: 'blocked',
        typecheck: 'passed',
        contentAudit: 'passed',
      },
      null,
      2,
    ),
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.status ?? 'spawn'})\n${result.stdout || ''}\n${result.stderr || ''}`,
    );
  }
  return result.stdout;
}

function normalize(value) {
  return value.replaceAll('\\', '/').replace(/^package\//u, '');
}

function assertIntentionalFiles(paths) {
  const unexpected = paths.find(
    (file) =>
      !['package.json', 'README.md', 'CHANGELOG.md'].includes(file) &&
      !file.startsWith('dist/'),
  );
  if (unexpected)
    throw new Error(`Packed archive contains unexpected file ${unexpected}.`);
  const buildInfo = paths.find((file) => file.endsWith('.tsbuildinfo'));
  if (buildInfo) throw new Error(`Packed archive contains ${buildInfo}.`);
}

function assertInstalledManifest(manifest) {
  if (manifest.version !== '0.1.0') {
    throw new Error(
      `Expected released repository version 0.1.0, got ${manifest.version}.`,
    );
  }
  if (manifest.engines?.node !== '>=22') {
    throw new Error('Packed package is missing the Node.js >=22 contract.');
  }
  if (manifest.repository?.directory !== 'libs/cap-transport-kafka') {
    throw new Error('Packed package has an incorrect repository.directory.');
  }
  assertNoDependencyProtocols(manifest);
  const installedCore = readJson(
    path.join(
      projectDir,
      'node_modules',
      '@mikara89',
      'cap-core',
      'package.json',
    ),
  );
  if (installedCore.version !== coreMinimum) {
    throw new Error(
      `Expected ${corePackage}@${coreMinimum}, got ${installedCore.version}.`,
    );
  }
}

function assertNoDependencyProtocols(manifest) {
  for (const section of [
    manifest.dependencies ?? {},
    manifest.devDependencies ?? {},
    manifest.peerDependencies ?? {},
    manifest.optionalDependencies ?? {},
  ]) {
    const leaked = Object.entries(section).find(([, value]) =>
      /^(?:file:|workspace:)/u.test(value),
    );
    if (leaked)
      throw new Error(`Packed dependency ${leaked[0]} leaks ${leaked[1]}.`);
  }
}

function assertNoMonorepoLinks(directory) {
  const lock = readJson(path.join(directory, 'package-lock.json'));
  const leaked = Object.entries(lock.packages ?? {}).find(
    ([, value]) =>
      value?.link === true ||
      (typeof value?.resolved === 'string' &&
        normalize(value.resolved).includes(normalize(rootDir))),
  );
  if (leaked)
    throw new Error(
      `Installed dependency tree contains monorepo link ${leaked[0]}.`,
    );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
