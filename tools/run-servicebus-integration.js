const { spawnSync } = require('child_process');

process.env.CAP_SERVICEBUS_INTEGRATION_REQUIRED ??=
  process.env.SERVICEBUS_CONNECTION_STRING ? 'true' : 'false';
process.env.CAP_USE_REAL_SERVICEBUS_CLIENT = 'true';

const result = spawnSync(
  'npx',
  [
    'jest',
    '--config',
    './apps/cap-test-app/test/jest-integration.json',
    '--testPathPattern=transport-azure-servicebus.integration-spec.ts',
    '--runInBand',
  ],
  { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' },
);

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
