export const PUBLISHER = Symbol('CAP_PUBLISHER');
export const SUBSCRIBER = Symbol('CAP_SUBSCRIBER');

import type { InitOptions } from './initializer.interface';
import type { CapHeaders } from '../models/cap-headers.type';

export interface CapPublishMetadata {
  messageId: string;
}

export interface CapDeliveryMetadata {
  messageId?: string;
  dedupeKey?: string;
}

export interface IPublisher {
  emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: CapPublishMetadata,
  ): Promise<void>;
  /** Optional one-time initialization: create queues/topics if needed */
  initialize?(options?: InitOptions): Promise<void>;
}

export interface ISubscriber {
  consume(
    topic: string,
    group: string,
    onMessage: (
      payload: unknown,
      headers?: CapHeaders,
      metadata?: CapDeliveryMetadata,
    ) => Promise<void>,
  ): Promise<void>;
  /** Optional one-time initialization: create queues/topics if needed */
  initialize?(options?: InitOptions): Promise<void>;
}
