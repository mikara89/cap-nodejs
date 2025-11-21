import { type CapBaseMessage } from './cap-base-message';

/**
 * What the *publisher* hands to CapService.
 * Storage/transport layers may enrich it, but the core library and
 * user code see only this contract.
 */
export interface CapPublishEvent<T = unknown> extends CapBaseMessage<T> {
  /** How many times the publish logic retried this record */
  retryCount: number;
  status?: 'published' | 'failed';
}
