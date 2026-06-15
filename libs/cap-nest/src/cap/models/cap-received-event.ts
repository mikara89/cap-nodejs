import { type CapBaseMessage } from './cap-base-message';
import { type JsonValue } from './json-value.type';

export type CapReceivedStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'dead_letter';

/**
 * Message as observed on the subscriber side, AFTER persistence.
 */
export interface CapReceivedEvent<T = JsonValue> extends CapBaseMessage<T> {
  /** Consumer-group (queue) that received the delivery */
  group: string;

  /** Broker/source message id used for inbox deduplication. */
  messageId: string;

  /** Stable dedupe key; defaults to `${topic}|${group}|${messageId}`. */
  dedupeKey: string;

  /** How many handler attempts so far */
  retryCount: number;

  /** Current inbox processing state. */
  status: CapReceivedStatus;

  /** true when handler completed successfully */
  processed: boolean;

  /** Last handler error message, if processing failed. */
  lastError?: string | null;

  /** When the handler completed successfully. */
  processedAt?: Date | null;

  /**
   *  When this message becomes eligible for the next retry.
   *  • `null`  – first attempt still pending
   *  • Date    – retry after that instant
   */
  nextRetry: Date | null;
}
