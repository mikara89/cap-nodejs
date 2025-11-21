import { type CapHeaders } from './cap-headers.type';

/**
 * Core shape every CAP message shares – NEVER mutate these fields in-place;
 * keep messages immutable.
 */
export interface CapBaseMessage<T = unknown> {
  /** Globally unique ID (UUID v4 recommended) */
  id: string;

  /** Logical topic / exchange name, e.g. `user.created` */
  topic: string;

  /** UTC ISO string set by publisher (not the DB timestamp) */
  occurredAt: string;

  /** User-defined payload.  Keep it serialisable. */
  payload: T;

  /** Optional key/value headers (trace-id, saga-id, etc.). */
  headers?: CapHeaders;
}
