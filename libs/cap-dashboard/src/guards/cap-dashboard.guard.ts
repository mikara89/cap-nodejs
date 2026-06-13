import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { isObservable, lastValueFrom, Observable } from 'rxjs';

// Token name used to register the user-provided guard provider in the module
const USER_GUARD_TOKEN = 'CAP_DASHBOARD_USER_GUARD';
type GuardResult = boolean | Promise<boolean> | Observable<boolean>;
type GuardFunction = (context: ExecutionContext) => GuardResult;
type DashboardGuardDelegate = CanActivate | GuardFunction;

@Injectable()
export class CapDashboardGuard implements CanActivate {
  constructor(
    @Inject(USER_GUARD_TOKEN)
    private readonly userGuard: DashboardGuardDelegate,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.userGuard) return false;
    // If the user guard is a class provider with canActivate, call it.
    if (hasCanActivate(this.userGuard)) {
      const result = this.userGuard.canActivate(context);
      return normalizeGuardResult(result);
    }
    // If the provider was a factory returning a function
    if (typeof this.userGuard === 'function') {
      const res = this.userGuard(context);
      return normalizeGuardResult(res);
    }
    return false;
  }
}

function hasCanActivate(guard: DashboardGuardDelegate): guard is CanActivate {
  return typeof guard === 'object' && guard !== null && 'canActivate' in guard;
}

async function normalizeGuardResult(result: GuardResult): Promise<boolean> {
  if (isObservable(result)) {
    return lastValueFrom(result);
  }

  return result instanceof Promise ? result : result;
}
