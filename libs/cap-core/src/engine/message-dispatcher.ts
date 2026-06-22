import type { CapEngine } from './cap-engine';

export interface MessageDispatcher {
  dispatchOutboxBatch(): Promise<number>;
}

export type CapEngineMessageDispatcher = Pick<CapEngine, 'dispatchOutboxBatch'>;
