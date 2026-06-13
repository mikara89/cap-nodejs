import { Controller, DynamicModule, Module, Provider } from '@nestjs/common';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CapDashboardController } from './cap-dashboard.controller';
import { CapDashboardService } from './cap-dashboard.service';
import { CapDashboardGuard } from './guards/cap-dashboard.guard';

export interface CapDashboardModuleOptions {
  routePrefix?: string; // default '/api/cap'
  guard: Provider; // REQUIRED
  pageSizeDefault?: number;
  serveStatic?: boolean; // default true
  staticAssetsPath?: string; // default './public'
  uiRoute?: string; // default '/cap-dashboard'
}

@Module({})
export class CapDashboardModule {
  static forRoot(opts: CapDashboardModuleOptions): DynamicModule {
    if (!opts?.guard) {
      throw new Error('CapDashboardModule.forRoot requires a `guard` provider');
    }

    // Alias the user-provided guard to a stable token our internal guard can inject
    const USER_GUARD_TOKEN = 'CAP_DASHBOARD_USER_GUARD';
    let providedToken: unknown = opts.guard;
    if (
      typeof opts.guard === 'object' &&
      opts.guard !== null &&
      'provide' in (opts.guard as any)
    ) {
      providedToken = (opts.guard as any).provide;
    }

    const aliasProvider: Provider = {
      provide: USER_GUARD_TOKEN,
      useExisting: providedToken as any,
    } as Provider;

    const imports = [] as any[];
    if (opts.serveStatic !== false) {
      // Determine a sensible default static assets path when not provided by the user.
      // We try multiple candidate locations (library source, compiled package, monorepo layout)
      // and pick the first one that exists. If none exist we skip registering static serving.
      const candidates: string[] = [];
      if (opts.staticAssetsPath) {
        candidates.push(opts.staticAssetsPath);
      }
      // source layout when running from workspace (libs/cap-dashboard/src/public)
      candidates.push(join(__dirname, 'public'));
      // compiled package layout (package root /public)
      candidates.push(join(__dirname, '..', 'public'));
      // monorepo fallback path (when running from repo root)
      candidates.push(
        join(process.cwd(), 'libs', 'cap-dashboard', 'src', 'public'),
      );
      // installed package fallback
      candidates.push(
        join(process.cwd(), 'node_modules', '@cap', 'cap-dashboard', 'public'),
      );

      const found = candidates.find((p) => !!p && existsSync(p));
      if (found) {
        try {
          imports.push(
            ServeStaticModule.forRoot({
              rootPath: resolve(found),
              serveRoot: opts.uiRoute ?? '/cap-dashboard',
              serveStaticOptions: {
                index: 'index.html',
              },
            }),
          );
        } catch {
          // package not present in test environment; skip static registration
        }
      }
    }

    // If a routePrefix was provided, create a small subclass of the controller
    // and decorate it with @Controller(routePrefix) so all endpoints are rooted
    // under the chosen prefix. Otherwise register the controller as-is.
    let controllerToRegister: any = CapDashboardController;
    let routeBase = opts.routePrefix ?? '';
    if (routeBase && routeBase !== '') {
      // create subclass and apply Controller decorator at runtime
      controllerToRegister = class extends CapDashboardController {};
      try {
        // Nest expects controller paths without a leading slash
        if (typeof routeBase === 'string' && routeBase.startsWith('/')) {
          routeBase = routeBase.slice(1);
        }
        Controller(routeBase)(controllerToRegister);
      } catch {
        // if require fails (very unlikely), fall back to original controller
        controllerToRegister = CapDashboardController;
      }
    }

    return {
      module: CapDashboardModule,
      imports,
      controllers: [controllerToRegister],
      providers: [
        // include the user-provided guard provider so Nest can construct it
        opts.guard,
        // alias it to a stable token our internal guard can inject
        aliasProvider,
        CapDashboardService,
        CapDashboardGuard,
      ],
      exports: [CapDashboardService],
    } as DynamicModule;
  }
}
