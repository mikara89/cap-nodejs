import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Regression: the built dashboard must not import heartbeat symbols from
 * @mikara89/cap-core. It should use its own package-internal helper.
 */
describe('cap-dashboard-core packed import audit', () => {
  const distDir = path.resolve(__dirname, '..', '..', 'dist');

  const forbiddenPatterns = [
    /@mikara89\/cap-core.*runWithActiveLeaseHeartbeat/,
    /require\(.*@mikara89\/cap-core.*\).*runWithActiveLeaseHeartbeat/,
    /@mikara89\/cap-core\/dist\/.*active-lease-heartbeat/,
    /@mikara89\/cap-core\/utils\/active-lease-heartbeat/,
  ];

  const allowedInternalImport = /\.\/internal\/active-lease-heartbeat/;

  it('does not import heartbeat from @mikara89/cap-core in built JS', () => {
    const dashboardJs = readIfExists(
      path.join(distDir, 'dashboard.service.js'),
    );
    if (!dashboardJs) return;

    for (const pattern of forbiddenPatterns) {
      expect(dashboardJs).not.toMatch(pattern);
    }
  });

  it('imports heartbeat from package-internal path in built JS', () => {
    const dashboardJs = readIfExists(
      path.join(distDir, 'dashboard.service.js'),
    );
    if (!dashboardJs) return;

    expect(dashboardJs).toMatch(allowedInternalImport);
  });

  it('does not import heartbeat from @mikara89/cap-core in declarations', () => {
    const dashboardDts = readIfExists(
      path.join(distDir, 'dashboard.service.d.ts'),
    );
    if (!dashboardDts) return;

    for (const pattern of forbiddenPatterns) {
      expect(dashboardDts).not.toMatch(pattern);
    }
  });

  it('does not export heartbeat from dashboard public root source', () => {
    const indexSrc = path.resolve(__dirname, '..', 'index.ts');
    const source = fs.readFileSync(indexSrc, 'utf8');
    expect(source).not.toMatch(/active-lease-heartbeat/);
    expect(source).not.toMatch(/runWithActiveLeaseHeartbeat/);
  });

  it('does not export heartbeat from dashboard public root declaration', () => {
    const dts = readIfExists(path.join(distDir, 'index.d.ts'));
    if (!dts) return;

    expect(dts).not.toMatch(/active-lease-heartbeat/);
    expect(dts).not.toMatch(/runWithActiveLeaseHeartbeat/);
  });
});

function readIfExists(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
}
