import { type CapBaseMessage } from './cap-base-message';
import { type JsonValue } from './json-value.type';

export type CapPublishStatus =
  | 'pending'
  | 'processing'
  | 'published'
  | 'failed'
  | 'dead_letter';

/**
 * Outbox message as seen by CAP core and storage/transport adapters.
 */
export interface CapPublishEvent<T = JsonValue> extends CapBaseMessage<T> {
  /** How many times the publish logic retried this record. */
  retryCount: number;
  status: CapPublishStatus;
  nextRetryAt?: Date | null;
  lastError?: string | null;
  lockedBy?: string | null;
  lockedUntil?: Date | null;
  publishedAt?: Date | null;
}
