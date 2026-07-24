import {
  type CapReceivedEvent,
  type CapReceivedStatus,
} from '../models/cap-received-event';
import {
  type CapInboxSnapshot,
  type CapRequeueResult,
} from '../models/cap-messaging-administration';
import { type JsonValue } from '../models/json-value.type';
import { type InitOptions } from './initializer.port';
import {
  type DashboardListOptions,
  type DashboardListResult,
} from './dashboard-list.port';

export const RECEIVED_STORAGE = Symbol('CAP_RECEIVED_STORAGE');

export interface TrySaveReceivedResult<T extends JsonValue = JsonValue> {
  inserted: boolean;
  id: string;
  event: CapReceivedEvent<T>;
}

export interface MarkReceivedFailedOptions {
  maxRetries: number;
  nextRetryAt: Date;
  now: Date;
}

export interface ReceivedStoragePort {
  trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>>;

  initialize?(options?: InitOptions): Promise<void>;

  markProcessed(id: string, processedAt?: Date): Promise<void>;

  getRetryDue(
    limit: number,
    now?: Date,
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent[]>;

  markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void>;

  findReceivedById?(id: string): Promise<CapReceivedEvent | undefined>;

  listReceived?(
    options: DashboardListOptions,
  ): Promise<DashboardListResult<CapReceivedEvent>>;
}

/** Optional durable inbox administration capability. */
export interface ReceivedStorageAdministrationPort extends ReceivedStoragePort {
  requeueReceived(
    id: string,
    now?: Date,
  ): Promise<CapRequeueResult<CapReceivedStatus>>;

  getReceivedSnapshot(): Promise<CapInboxSnapshot>;
}

export function isReceivedStorageAdministrationPort(
  storage: ReceivedStoragePort,
): storage is ReceivedStorageAdministrationPort {
  const candidate = storage as Partial<ReceivedStorageAdministrationPort>;
  return (
    typeof candidate.requeueReceived === 'function' &&
    typeof candidate.getReceivedSnapshot === 'function'
  );
}
