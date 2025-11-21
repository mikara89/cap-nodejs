import { type CapPublishEvent } from '../models/cap-publish-event';
import { CapReceivedEvent } from '../models/cap-received-event';

/** IoC tokens – easier than string literals */
export const PUBLISH_STORAGE = Symbol('CAP_PUBLISH_STORAGE');
export const RECEIVED_STORAGE = Symbol('CAP_RECEIVED_STORAGE');

/*------------------------------------------------------------------
 | Outbox  ▸ messages we PRODUCE
 *-----------------------------------------------------------------*/
export interface IPublishStorage {
  /** Insert a fresh record and return its DB id */
  savePublish<T = unknown>(evt: CapPublishEvent<T>): Promise<string>;

  /** Mark record as successfully emitted to the broker */
  markPublished(id: string): Promise<void>;

  /** Fetch N unpublished rows – used by retry-scheduler */
  getUnpublished(limit: number): Promise<Array<CapPublishEvent>>;
}

/*------------------------------------------------------------------
 | Inbox  ▸ messages we CONSUME
 *-----------------------------------------------------------------*/
export interface IReceivedStorage {
  /** Persist a delivery; return record id */
  saveReceived<T = unknown>(evt: CapReceivedEvent<T>): Promise<string>;

  /** Mark processed=true */
  markProcessed(id: string): Promise<void>;

  /**
   * Return records that are not yet processed and
   * whose nextRetry timestamp <= now.  Scheduler uses this.
   */
  getRetryDue(limit: number): Promise<Array<CapReceivedEvent>>;

  /**
   * Schedule a retry for a given event.
   * @param id - The ID of the event to retry.
   * @param retryCount - The number of retry attempts made so far.
   * @param nextRetry - The next scheduled retry time.
   */
  scheduleRetry(id: string, retryCount: number, nextRetry: Date): Promise<void>;
}
export { CapReceivedEvent };
