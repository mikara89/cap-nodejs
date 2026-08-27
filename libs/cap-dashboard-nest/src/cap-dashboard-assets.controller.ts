import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { CapDashboardAccess } from './cap-dashboard.auth';
import { CapDashboardGuard } from './guards/cap-dashboard.guard';

const CONTENT_TYPES: Record<string, string> = {
  'index.html': 'text/html; charset=utf-8',
  'main.js': 'text/javascript; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
};

@Controller()
@UseGuards(CapDashboardGuard)
@CapDashboardAccess('ui.view', 'read')
export class CapDashboardAssetsController {
  static assetsPath = '';

  @Get()
  getIndex(): StreamableFile {
    return this.getAssetFile('index.html');
  }

  @Get(':file')
  getAsset(@Param('file') file: string): StreamableFile {
    return this.getAssetFile(file);
  }

  private getAssetFile(file: string): StreamableFile {
    const contentType = Object.prototype.hasOwnProperty.call(CONTENT_TYPES, file)
      ? CONTENT_TYPES[file]
      : undefined;
    if (!contentType) {
      throw new NotFoundException();
    }

    // Retrieve the safe key directly from the allowlist to break user-controlled taint flow
    const safeFile = Object.keys(CONTENT_TYPES).find((k) => k === file);
    if (!safeFile) {
      throw new NotFoundException();
    }

    const assetsRoot = resolve(
      (this.constructor as typeof CapDashboardAssetsController).assetsPath,
    );
    const path = resolve(assetsRoot, safeFile);
    if (path !== assetsRoot && !path.startsWith(assetsRoot + sep)) {
      throw new NotFoundException();
    }

    if (!existsSync(path)) {
      throw new NotFoundException();
    }

    return new StreamableFile(readFileSync(path), {
      type: contentType,
    });
  }
}
