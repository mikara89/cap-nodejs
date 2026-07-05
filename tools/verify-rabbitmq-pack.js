'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const packageName = '@mikara89/cap-transport-rabbitmq';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for the pack smoke.');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-rabbitmq-pack-'));
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
  const pack = parsePackOutput(packOutput)[0];
  if (!pack?.filename || !Array.isArray(pack.files)) {
    throw new Error('npm pack did not return the expected file manifest.');
  }

  const paths = pack.files.map((file) => normalize(file.path));
  const forbiddenPath = paths.find(
    (file) =>
      file.startsWith('src/') ||
      /(^|\/)(test|tests|__tests__)(\/|$)/u.test(file) ||
      /\.(spec|test)\.[cm]?[jt]sx?$/u.test(file),
  );
  if (forbiddenPath) {
    throw new Error(
      `Packed archive contains forbidden source/test file ${forbiddenPath}.`,
    );
  }
  for (const required of [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'dist/index.js',
    'dist/index.d.ts',
  ]) {
    if (!paths.includes(required)) {
      throw new Error(`Packed archive is missing ${required}.`);
    }
  }

  const tarball = path.join(tempDir, pack.filename);
  writeJson(path.join(projectDir, 'package.json'), {
    name: 'rabbitmq-pack-smoke',
    private: true,
    version: '0.0.0',
  });
  run(
    process.execPath,
    [
      npmCli,
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--save-exact',
      tarball,
    ],
    projectDir,
  );

  const installedDir = path.join(
    projectDir,
    'node_modules',
    '@mikara89',
    'cap-transport-rabbitmq',
  );
  const installedManifest = readJson(path.join(installedDir, 'package.json'));
  const dependencyNames = Object.keys(installedManifest.dependencies || {});
  assertNoForbiddenDependencies(dependencyNames);
  assertNoForbiddenImports(installedDir);

  run(
    process.execPath,
    [
      '-e',
      [
        `const transport = require(${JSON.stringify(packageName)});`,
        "if (typeof transport.RabbitMqPublisher !== 'function') process.exit(2);",
        "if (typeof transport.RabbitMqSubscriber !== 'function') process.exit(3);",
      ].join(' '),
    ],
    projectDir,
  );

  fs.writeFileSync(
    path.join(projectDir, 'usage.ts'),
    [
      `import { RabbitMqPublisher, RabbitMqSubscriber, type RabbitMqOptions } from '${packageName}';`,
      "const options: RabbitMqOptions = { url: 'amqp://localhost', queueType: 'classic' };",
      'const publisher = new RabbitMqPublisher(options);',
      'const subscriber = new RabbitMqSubscriber(options);',
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

  console.log(
    JSON.stringify(
      {
        package: `${installedManifest.name}@${installedManifest.version}`,
        archive: pack.filename,
        files: paths.length,
        rootImport: 'passed',
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
      { cause: result.error },
    );
  }
  return result.stdout;
}

function parsePackOutput(output) {
  const start = output.lastIndexOf('\n[');
  const json =
    start >= 0 ? output.slice(start + 1) : output.slice(output.indexOf('['));
  return JSON.parse(json.trim());
}

function assertNoForbiddenDependencies(names) {
  const forbidden = names.find((name) =>
    /(^@nestjs\/|express|kafka|aws|sns|sqs|nats)/iu.test(name),
  );
  if (forbidden)
    throw new Error(`Packed package has forbidden dependency ${forbidden}.`);
}

function assertNoForbiddenImports(directory) {
  const forbidden =
    /@nestjs|(?:^|[\/'])express(?:[\/']|$)|kafka|aws-sdk|sns|sqs|nats/iu;
  for (const file of filesRecursively(directory)) {
    if (!/\.[cm]?js$/u.test(file)) continue;
    const contents = fs.readFileSync(file, 'utf8');
    if (forbidden.test(contents)) {
      throw new Error(`Packed runtime contains a forbidden import in ${file}.`);
    }
  }
}

function filesRecursively(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesRecursively(target) : [target];
  });
}

function normalize(value) {
  return value.replaceAll('\\', '/').replace(/^package\//u, '');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
