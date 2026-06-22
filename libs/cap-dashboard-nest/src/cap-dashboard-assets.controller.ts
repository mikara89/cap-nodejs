import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
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
    if (!Object.prototype.hasOwnProperty.call(CONTENT_TYPES, file)) {
      throw new NotFoundException();
    }

    const path = join(
      (this.constructor as typeof CapDashboardAssetsController).assetsPath,
      file,
    );
    if (!existsSync(path)) {
      throw new NotFoundException();
    }

    return new StreamableFile(readFileSync(path), {
      type: CONTENT_TYPES[file],
    });
  }
}
