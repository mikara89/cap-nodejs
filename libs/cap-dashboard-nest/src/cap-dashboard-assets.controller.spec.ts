import { NotFoundException, StreamableFile } from '@nestjs/common';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CapDashboardAssetsController } from './cap-dashboard-assets.controller';

describe('CapDashboardAssetsController', () => {
  let assetsPath: string;
  const originalAssetsPath = CapDashboardAssetsController.assetsPath;

  beforeEach(() => {
    assetsPath = mkdtempSync(join(tmpdir(), 'cap-dashboard-assets-'));
    writeFileSync(join(assetsPath, 'main.js'), 'console.log("ok");');
    CapDashboardAssetsController.assetsPath = assetsPath;
  });

  afterEach(() => {
    CapDashboardAssetsController.assetsPath = originalAssetsPath;
    rmSync(assetsPath, { recursive: true, force: true });
  });

  it('serves allowlisted assets with the expected content type', () => {
    const controller = new CapDashboardAssetsController();

    const file = controller.getAsset('main.js');

    expect(file).toBeInstanceOf(StreamableFile);
    expect(file.getHeaders()).toMatchObject({
      type: 'text/javascript; charset=utf-8',
    });
  });

  it('rejects non-allowlisted asset names', () => {
    const controller = new CapDashboardAssetsController();

    expect(() => controller.getAsset('../main.js')).toThrow(NotFoundException);
  });
});
