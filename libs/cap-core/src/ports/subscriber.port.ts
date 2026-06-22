import { type CapHeaders } from '../models/cap-headers.type';
import { type InitOptions } from './initializer.port';

export const SUBSCRIBER = Symbol('CAP_SUBSCRIBER');

export interface SubscribeMetadata {
  messageId?: string;
  dedupeKey?: string;
}

export type CapHandler<T = unknown> = (
  payload: T,
  headers?: CapHeaders,
  metadata?: SubscribeMetadata,
) => Promise<void> | void;

export interface SubscriberPort {
  consume(topic: string, group: string, handler: CapHandler): Promise<void>;

  initialize?(options?: InitOptions): Promise<void>;
  close?(): Promise<void>;
}
