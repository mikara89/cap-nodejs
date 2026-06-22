import { type CapHeaders } from '../models/cap-headers.type';
import { type JsonValue } from '../models/json-value.type';
import { type InitOptions } from './initializer.port';

export const PUBLISHER = Symbol('CAP_PUBLISHER');

export interface PublishMetadata {
  messageId: string;
  dedupeKey?: string;
}

export interface PublisherPort {
  emit<T extends JsonValue = JsonValue>(
    topic: string,
    payload: T,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void>;

  initialize?(options?: InitOptions): Promise<void>;
}
