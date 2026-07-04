'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const packageName = '@mikara89/cap-transport-kafka';
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
      ].join(' '),
    ],
    projectDir,
  );

  fs.writeFileSync(
    path.join(projectDir, 'usage.ts'),
    [
      `import { KafkaPublisher, KafkaSubscriber, type KafkaOptions } from '${packageName}';`,
      "const options: KafkaOptions = { brokers: ['localhost:9092'], producer: { acks: -1 } };",
      'const publisher = new KafkaPublisher(options);',
      'const subscriber = new KafkaSubscriber(options);',
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
  console.log(
    JSON.stringify(
      {
        package: `${installedManifest.name}@${installedManifest.version}`,
        archive: pack.filename,
        files: paths.length,
        nativeInstall: 'passed',
        rootImport: 'passed',
        typecheck: 'passed',
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
