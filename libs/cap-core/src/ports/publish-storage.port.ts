import { type CapPublishEvent } from '../models/cap-publish-event';
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
}

export interface PublishStoragePort {
  savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
  ): Promise<string>;

  initialize?(options?: InitOptions): Promise<void>;

  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent[]>;

  markPublished(id: string, publishedAt?: Date): Promise<void>;

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void>;

  releaseExpiredClaims(now: Date): Promise<void>;

  findPublishById?(id: string): Promise<CapPublishEvent | undefined>;

  listPublish?(
    options: DashboardListOptions,
  ): Promise<DashboardListResult<CapPublishEvent>>;
}

export interface TransactionalPublishStoragePort extends PublishStoragePort {
  savePublishWithTx<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    tx: unknown,
  ): Promise<string>;
}
