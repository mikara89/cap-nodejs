import { type CapHeaders } from './cap-headers.type';
import { type CapOperationContext } from './cap-operation-context';

export const DEFAULT_INBOX_FALLBACK_WINDOW_MS = 240_000;

export interface CapPublishOptions<TTx = unknown> {
  headers?: CapHeaders;
  tx?: TTx;
  ctx?: CapOperationContext<TTx>;
  immediate?: boolean;
}

export interface CapSubscribeOptions<T = unknown> {
  topic: string;
  group?: string;
  dto?: new () => T;
  filter?: (payload: T) => boolean | Promise<boolean>;
}

export interface CapSchedulerOptions {
  batchSize?: number;
  leaseMs?: number;
  /**
   * How long a pending inbox message may remain incomplete before scheduler
   * recovery may retry it. Defaults to four minutes.
   */
  inboxFallbackWindowMs?: number;
  maxRetries?: number;
  maxInboxRetries?: number;
  instanceId?: string;
  disabled?: boolean;
}
