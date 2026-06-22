import { type CapHeaders } from './cap-headers.type';

export interface CapPublishOptions {
  headers?: CapHeaders;
  tx?: unknown;
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
  maxRetries?: number;
  maxInboxRetries?: number;
  instanceId?: string;
  disabled?: boolean;
}
