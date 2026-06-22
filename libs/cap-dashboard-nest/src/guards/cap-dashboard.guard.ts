import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { isObservable, lastValueFrom, Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import {
  CAP_DASHBOARD_ACCESS_METADATA,
  CAP_DASHBOARD_AUTHORIZER,
  CAP_DASHBOARD_USER_GUARD,
  CapDashboardAccess,
  type CapDashboardAuthorizerDelegate,
  type CapDashboardAuthorizationContext,
} from '../cap-dashboard.auth';

type GuardResult = boolean | Promise<boolean> | Observable<boolean>;
type GuardFunction = (context: ExecutionContext) => GuardResult;
type DashboardGuardDelegate = CanActivate | GuardFunction;

@Injectable()
export class CapDashboardGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CAP_DASHBOARD_USER_GUARD)
    private readonly userGuard: DashboardGuardDelegate,
    @Optional()
    @Inject(CAP_DASHBOARD_AUTHORIZER)
    private readonly authorizer?: CapDashboardAuthorizerDelegate,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.userGuard) return false;
    const access = this.getAccess(context);
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    request.capDashboard = access;

    // If the user guard is a class provider with canActivate, call it.
    if (hasCanActivate(this.userGuard)) {
      const result = this.userGuard.canActivate(context);
      const allowed = await normalizeGuardResult(result);
      if (!allowed) return false;
      return this.authorize(context, access, request);
    }
    // If the provider was a factory returning a function
    if (typeof this.userGuard === 'function') {
      const res = this.userGuard(context);
      const allowed = await normalizeGuardResult(res);
      if (!allowed) return false;
      return this.authorize(context, access, request);
    }
    return false;
  }

  private getAccess(context: ExecutionContext): CapDashboardAccess {
    return (
      this.reflector.getAllAndOverride<CapDashboardAccess>(
        CAP_DASHBOARD_ACCESS_METADATA,
        [context.getHandler(), context.getClass()],
      ) ?? { action: 'ui.view', permission: 'read' }
    );
  }

  private authorize(
    executionContext: ExecutionContext,
    access: CapDashboardAccess,
    request: unknown,
  ): Promise<boolean> {
    if (!this.authorizer) return Promise.resolve(true);

    const context: CapDashboardAuthorizationContext = {
      ...access,
      request,
      executionContext,
    };

    if (hasAuthorize(this.authorizer)) {
      return normalizeGuardResult(this.authorizer.authorize(context));
    }

    return normalizeGuardResult(this.authorizer(context));
  }
}

function hasCanActivate(guard: DashboardGuardDelegate): guard is CanActivate {
  return typeof guard === 'object' && guard !== null && 'canActivate' in guard;
}

function hasAuthorize(
  authorizer: CapDashboardAuthorizerDelegate,
): authorizer is {
  authorize: (context: CapDashboardAuthorizationContext) => GuardResult;
} {
  return (
    typeof authorizer === 'object' &&
    authorizer !== null &&
    'authorize' in authorizer
  );
}

async function normalizeGuardResult(result: GuardResult): Promise<boolean> {
  if (isObservable(result)) {
    return lastValueFrom(result);
  }

  return result instanceof Promise ? result : result;
}
