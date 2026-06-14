import { type CapBaseMessage } from './cap-base-message';
import { type JsonValue } from './json-value.type';

export type CapPublishStatus =
  | 'pending'
  | 'processing'
  | 'published'
  | 'failed'
  | 'dead_letter';

/**
 * What the *publisher* hands to CapService.
 * Storage/transport layers may enrich it, but the core library and
 * user code see only this contract.
 */
export interface CapPublishEvent<T = JsonValue> extends CapBaseMessage<T> {
  /** How many times the publish logic retried this record */
  retryCount: number;
  status: CapPublishStatus;
  nextRetryAt?: Date | null;
  lastError?: string | null;
  lockedBy?: string | null;
  lockedUntil?: Date | null;
  publishedAt?: Date | null;
}
