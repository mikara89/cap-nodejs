'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for the pack smoke.');

for (const name of ['knex', 'typeorm', 'prisma']) {
  const packageName = `@mikara89/cap-storage-${name}`;
  const output = run(process.execPath, [
    npmCli,
    'pack',
    '--json',
    '--dry-run',
    '--workspace',
    packageName,
  ]);
  const pack = parsePackOutput(output)[0];
  const files = new Set(pack.files.map((file) => normalize(file.path)));

  for (const required of [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/nest/index.js',
    'dist/nest/index.d.ts',
    `dist/nest/${name === 'typeorm' ? 'typeorm' : name}-storage.module.js`,
    `dist/nest/${name === 'typeorm' ? 'typeorm' : name}-storage.module.d.ts`,
  ]) {
    if (!files.has(required)) {
      throw new Error(`${packageName} pack is missing ${required}.`);
    }
  }

  const root = require(
    path.join(rootDir, 'libs', `cap-storage-${name}`, 'dist'),
  );
  const moduleName =
    name === 'typeorm'
      ? 'TypeOrmStorageModule'
      : `${name[0].toUpperCase()}${name.slice(1)}StorageModule`;
  if (moduleName in root) {
    throw new Error(`${packageName} root unexpectedly exports ${moduleName}.`);
  }

  const nest = require(
    path.join(rootDir, 'libs', `cap-storage-${name}`, 'dist', 'nest'),
  );
  if (typeof nest[moduleName] !== 'function') {
    throw new Error(`${packageName}/nest does not export ${moduleName}.`);
  }
}

console.log('Storage Nest pack smoke passed.');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
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

function normalize(file) {
  return file.replaceAll('\\', '/');
}
