import { type CapHeaders } from './cap-headers.type';
import { type JsonValue } from './json-value.type';

/**
 * Core shape every CAP message shares. Keep messages immutable once created.
 */
export interface CapBaseMessage<T = JsonValue> {
  /** Globally unique ID (UUID v4 recommended). */
  id: string;

  /** Logical topic / exchange name, e.g. `user.created`. */
  topic: string;

  /** UTC ISO string set by publisher, not the DB timestamp. */
  occurredAt: string;

  /** User-defined payload. Keep it serializable. */
  payload: T;

  /** Optional key/value headers such as trace-id or saga-id. */
  headers?: CapHeaders;
}
