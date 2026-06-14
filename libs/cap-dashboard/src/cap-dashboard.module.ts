import {
  Controller,
  DynamicModule,
  InjectionToken,
  Module,
  Provider,
  Type,
} from '@nestjs/common';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { CapDashboardController } from './cap-dashboard.controller';
import { CapDashboardService } from './cap-dashboard.service';
import { CapDashboardGuard } from './guards/cap-dashboard.guard';
import { CapDashboardAssetsController } from './cap-dashboard-assets.controller';
import {
  CAP_DASHBOARD_AUTHORIZER,
  CAP_DASHBOARD_OPTIONS,
  CAP_DASHBOARD_USER_GUARD,
} from './cap-dashboard.auth';

export interface CapDashboardRedactionOptions {
  headers?: string[];
  payloadPaths?: string[];
}

export interface CapDashboardModuleOptions {
  routePrefix?: string; // default '/api/cap'
  guard: Provider; // REQUIRED
  authorizer?: Provider;
  pageSizeDefault?: number;
  readOnly?: boolean;
  maxPageSize?: number;
  redact?: CapDashboardRedactionOptions;
  serveStatic?: boolean; // default true
  staticAssetsPath?: string; // default './public'
  uiRoute?: string; // default '/cap-dashboard'
}

@Module({})
export class CapDashboardModule {
  static register(opts: CapDashboardModuleOptions): DynamicModule {
    return this.forRoot(opts);
  }

  static forRoot(opts: CapDashboardModuleOptions): DynamicModule {
    if (!opts?.guard) {
      throw new Error('CapDashboardModule.forRoot requires a `guard` provider');
    }

    const providedToken = getProviderToken(opts.guard);

    const aliasProvider: Provider = {
      provide: CAP_DASHBOARD_USER_GUARD,
      useExisting: providedToken,
    };

    const extraProviders: Provider[] = [];
    if (opts.authorizer) {
      const authorizerToken = getProviderToken(opts.authorizer);
      extraProviders.push(opts.authorizer, {
        provide: CAP_DASHBOARD_AUTHORIZER,
        useExisting: authorizerToken,
      });
    }

    const controllers: Type<unknown>[] = [];
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
        join(
          process.cwd(),
          'node_modules',
          '@mikara89',
          'cap-dashboard',
          'public',
        ),
      );

      const found = candidates.find((p) => !!p && existsSync(p));
      if (found) {
        let uiRoute = opts.uiRoute ?? '/cap-dashboard';
        if (typeof uiRoute === 'string' && uiRoute.startsWith('/')) {
          uiRoute = uiRoute.slice(1);
        }
        const assetsPath = resolve(found);
        const assetsController = class extends CapDashboardAssetsController {};
        assetsController.assetsPath = assetsPath;
        Controller(uiRoute)(assetsController);
        controllers.push(assetsController);
      }
    }

    // If a routePrefix was provided, create a small subclass of the controller
    // and decorate it with @Controller(routePrefix) so all endpoints are rooted
    // under the chosen prefix. Otherwise register the controller as-is.
    let controllerToRegister: Type<CapDashboardController> =
      CapDashboardController;
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
      controllers: [controllerToRegister, ...controllers],
      providers: [
        // include the user-provided guard provider so Nest can construct it
        opts.guard,
        // alias it to a stable token our internal guard can inject
        aliasProvider,
        ...extraProviders,
        {
          provide: CAP_DASHBOARD_OPTIONS,
          useValue: {
            readOnly: opts.readOnly ?? false,
            maxPageSize: opts.maxPageSize ?? opts.pageSizeDefault ?? 100,
            redact: {
              headers: opts.redact?.headers ?? [
                'authorization',
                'cookie',
                'x-api-key',
              ],
              payloadPaths: opts.redact?.payloadPaths ?? [],
            },
          },
        },
        CapDashboardService,
        CapDashboardGuard,
      ],
      exports: [CapDashboardService],
    };
  }
}

function getProviderToken(provider: Provider): InjectionToken {
  if (hasProviderToken(provider)) {
    return provider.provide;
  }

  return provider as InjectionToken;
}

function hasProviderToken(
  provider: Provider,
): provider is Provider & { provide: InjectionToken } {
  return (
    typeof provider === 'object' && provider !== null && 'provide' in provider
  );
}
