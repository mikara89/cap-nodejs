import { SetMetadata } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Observable } from 'rxjs';

export const CAP_DASHBOARD_USER_GUARD = 'CAP_DASHBOARD_USER_GUARD';
export const CAP_DASHBOARD_AUTHORIZER = 'CAP_DASHBOARD_AUTHORIZER';
/** @internal */
export const CAP_DASHBOARD_ACCESS_METADATA = 'CAP_DASHBOARD_ACCESS_METADATA';

export type CapDashboardPermission = 'read' | 'admin';

export type CapDashboardAction =
  | 'ui.view'
  | 'outbox.list'
  | 'outbox.get'
  | 'outbox.retry'
  | 'outbox.markPublished'
  | 'inbox.list'
  | 'inbox.get'
  | 'inbox.retry'
  | 'inbox.markProcessed'
  | 'scheduler.flushOutbox';

export interface CapDashboardAccess {
  action: CapDashboardAction;
  permission: CapDashboardPermission;
}

export interface CapDashboardAuthorizationContext extends CapDashboardAccess {
  request: unknown;
  executionContext: ExecutionContext;
}

export type CapDashboardAuthorizationResult =
  | boolean
  | Promise<boolean>
  | Observable<boolean>;

export interface CapDashboardAuthorizer {
  authorize(
    context: CapDashboardAuthorizationContext,
  ): CapDashboardAuthorizationResult;
}

export type CapDashboardAuthorizerFunction = (
  context: CapDashboardAuthorizationContext,
) => CapDashboardAuthorizationResult;

export type CapDashboardAuthorizerDelegate =
  | CapDashboardAuthorizer
  | CapDashboardAuthorizerFunction;

export function CapDashboardAccess(
  action: CapDashboardAction,
  permission: CapDashboardPermission,
): MethodDecorator & ClassDecorator {
  return SetMetadata(CAP_DASHBOARD_ACCESS_METADATA, { action, permission });
}
