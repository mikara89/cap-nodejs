import type { CapEngine } from './cap-engine';

export interface InboxRetryProcessor {
  retryInboxBatch(): Promise<number>;
}

export type CapEngineInboxRetryProcessor = Pick<CapEngine, 'retryInboxBatch'>;
