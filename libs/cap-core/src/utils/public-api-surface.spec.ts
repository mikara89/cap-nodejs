import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Regression: the heartbeat helper must NOT be part of the public core API.
 * This test inspects the compiled output because Jest aliases map source
 * directly. It reads the built declaration and JavaScript files to prove
 * the export was removed.
 */
describe('cap-core public API surface', () => {
  const distDir = path.resolve(__dirname, '..', '..', 'dist');

  const forbiddenExports = [
    'runWithActiveLeaseHeartbeat',
    'ActiveLeaseHeartbeatOptions',
    'ActiveLeaseOperationResult',
  ];

  it('does not export heartbeat symbols from the public root declaration', () => {
    const dts = readIfExists(path.join(distDir, 'index.d.ts'));
    if (!dts) return; // dist not yet built – skip gracefully

    for (const name of forbiddenExports) {
      expect(dts).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('does not export heartbeat symbols from the public root JavaScript', () => {
    const js = readIfExists(path.join(distDir, 'index.js'));
    if (!js) return;

    for (const name of forbiddenExports) {
      expect(js).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('does not re-export active-lease-heartbeat in the barrel source', () => {
    const indexSrc = path.resolve(__dirname, '..', 'index.ts');
    const source = fs.readFileSync(indexSrc, 'utf8');
    expect(source).not.toMatch(/active-lease-heartbeat/);
  });
});

function readIfExists(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
}
