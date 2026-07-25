import {
  type CapPublishEvent,
  type CapPublishStatus,
} from '../models/cap-publish-event';
import {
  type CapOutboxSnapshot,
  type CapRequeueResult,
} from '../models/cap-messaging-administration';
import { type CapOperationContext } from '../models/cap-operation-context';
import { type JsonValue } from '../models/json-value.type';
import { type InitOptions } from './initializer.port';
import {
  type DashboardListOptions,
  type DashboardListResult,
} from './dashboard-list.port';

export const PUBLISH_STORAGE = Symbol('CAP_PUBLISH_STORAGE');

export interface ClaimUnpublishedOptions {
  limit: number;
  lockedBy: string;
  lockUntil: Date;
  now: Date;
}

export interface MarkPublishFailedOptions {
  maxRetries: number;
  nextRetryAt: Date;
  now: Date;
  expectedLockedBy?: string;
}

export interface PublishClaimOwnership {
  expectedLockedBy?: string;
}

export interface RenewPublishClaimOptions {
  id: string;
  expectedLockedBy: string;
  lockUntil: Date;
  now: Date;
}

export interface PublishStoragePort<TTx = unknown> {
  savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    ctx?: CapOperationContext<TTx>,
  ): Promise<string>;

  initialize?(options?: InitOptions): Promise<void>;

  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent[]>;

  markPublished(
    id: string,
    publishedAt?: Date,
    ownership?: PublishClaimOwnership,
  ): Promise<boolean | void>;

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean | void>;

  renewPublishClaim?(options: RenewPublishClaimOptions): Promise<boolean>;

  releaseExpiredClaims(now: Date): Promise<void>;

  findPublishById?(id: string): Promise<CapPublishEvent | undefined>;

  listPublish?(
    options: DashboardListOptions,
  ): Promise<DashboardListResult<CapPublishEvent>>;
}

export interface TransactionalPublishStoragePort<
  TTx = unknown,
> extends PublishStoragePort<TTx> {
  /**
   * @deprecated Use savePublish(event, { tx }) instead.
   */
  savePublishWithTx<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    tx: TTx,
  ): Promise<string>;
}

/** Optional durable outbox administration capability. */
export interface PublishStorageAdministrationPort<
  TTx = unknown,
> extends PublishStoragePort<TTx> {
  requeuePublish(
    id: string,
    now?: Date,
  ): Promise<CapRequeueResult<CapPublishStatus>>;

  getPublishSnapshot(): Promise<CapOutboxSnapshot>;
}

export function isPublishStorageAdministrationPort<TTx = unknown>(
  storage: PublishStoragePort<TTx>,
): storage is PublishStorageAdministrationPort<TTx> {
  const candidate = storage as Partial<PublishStorageAdministrationPort<TTx>>;
  return (
    typeof candidate.requeuePublish === 'function' &&
    typeof candidate.getPublishSnapshot === 'function'
  );
}

export function isLegacyTransactionalPublishStorage<TTx = unknown>(
  storage: PublishStoragePort<TTx>,
): storage is TransactionalPublishStoragePort<TTx> & {
  savePublishWithTx: NonNullable<
    TransactionalPublishStoragePort<TTx>['savePublishWithTx']
  >;
} {
  return (
    typeof (storage as TransactionalPublishStoragePort<TTx>)
      .savePublishWithTx === 'function'
  );
}
