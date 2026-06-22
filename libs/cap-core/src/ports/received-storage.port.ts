import { type CapReceivedEvent } from '../models/cap-received-event';
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

  getRetryDue(limit: number, now?: Date): Promise<CapReceivedEvent[]>;

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
