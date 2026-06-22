export type CapDashboardPermission = 'read' | 'admin';

export type CapDashboardAction =
  | 'ui.view'
  | 'outbox.list'
  | 'outbox.get'
  | 'outbox.fullPayload'
  | 'outbox.retry'
  | 'outbox.markPublished'
  | 'inbox.list'
  | 'inbox.get'
  | 'inbox.fullPayload'
  | 'inbox.retry'
  | 'inbox.markProcessed'
  | 'scheduler.flushOutbox';

export interface CapDashboardAccess {
  action: CapDashboardAction;
  permission: CapDashboardPermission;
}

export interface CapDashboardAuthorizationContext extends CapDashboardAccess {
  request?: unknown;
  user?: unknown;
}

export type CapDashboardAuthorizationResult = boolean | Promise<boolean>;

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
