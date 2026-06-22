import type { InitOptions } from './initializer.interface';
import type { CapHeaders } from '../models/cap-headers.type';
import {
  PUBLISHER as CORE_PUBLISHER,
  SUBSCRIBER as CORE_SUBSCRIBER,
} from '@mikara89/cap-core';

export const PUBLISHER = CORE_PUBLISHER;
export const SUBSCRIBER = CORE_SUBSCRIBER;

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
