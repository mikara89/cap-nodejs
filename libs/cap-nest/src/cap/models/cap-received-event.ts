import { type CapBaseMessage } from './cap-base-message';

/**
 * Message as observed on the subscriber side, AFTER persistence.
 */
export interface CapReceivedEvent<T = unknown> extends CapBaseMessage<T> {
  //   nextRetry: Date;
  /** Consumer-group (queue) that received the delivery */
  group: string;

  /** How many handler attempts so far */
  retryCount: number;

  /** true when handler completed successfully */
  processed: boolean;

  /**
   *  When this message becomes eligible for the next retry.
   *  • `null`  – first attempt still pending
   *  • Date    – retry after that instant
   */
  nextRetry: Date | null;
}
