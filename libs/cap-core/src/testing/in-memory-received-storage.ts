import { type CapReceivedEvent } from '../models/cap-received-event';
import { type JsonValue } from '../models/json-value.type';
import {
  type MarkReceivedFailedOptions,
  type ReceivedStoragePort,
  type TrySaveReceivedResult,
} from '../ports/received-storage.port';

export class InMemoryReceivedStorage implements ReceivedStoragePort {
  readonly store = new Map<string, CapReceivedEvent<JsonValue>>();
  private readonly dedupe = new Map<string, string>();

  trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    const identity = this.dedupeIdentity(event);
    const existingId = this.dedupe.get(identity);
    if (existingId) {
      return Promise.resolve({
        inserted: false,
        id: existingId,
        event: this.store.get(existingId) as CapReceivedEvent<T>,
      });
    }

    this.store.set(event.id, event);
    this.dedupe.set(identity, event.id);
    return Promise.resolve({ inserted: true, id: event.id, event });
  }

  markProcessed(id: string, processedAt = new Date()): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.status = 'processed';
      event.processed = true;
      event.processedAt = processedAt;
      event.nextRetry = null;
    }
    return Promise.resolve();
  }

  getRetryDue(
    limit: number,
    now = new Date(),
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent<JsonValue>[]> {
    const nowMs = now.getTime();
    return Promise.resolve(
      [...this.store.values()]
        .filter((event) => {
          if (event.status === 'failed') {
            return event.nextRetry ? event.nextRetry.getTime() <= nowMs : false;
          }
          if (event.status === 'pending' && pendingBefore !== undefined) {
            return (
              new Date(event.occurredAt).getTime() <= pendingBefore.getTime()
            );
          }
          return false;
        })
        .sort((left, right) => {
          const leftTime =
            left.status === 'failed' && left.nextRetry
              ? left.nextRetry.getTime()
              : new Date(left.occurredAt).getTime();
          const rightTime =
            right.status === 'failed' && right.nextRetry
              ? right.nextRetry.getTime()
              : new Date(right.occurredAt).getTime();
          if (leftTime !== rightTime) return leftTime - rightTime;
          return left.id.localeCompare(right.id);
        })
        .slice(0, limit)
        .map((event) => ({ ...event })),
    );
  }

  markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    const event = this.store.get(id);
    if (!event) return Promise.resolve();
    event.retryCount += 1;
    event.status =
      event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
    event.nextRetry =
      event.status === 'dead_letter' ? null : options.nextRetryAt;
    event.lastError = error instanceof Error ? error.message : String(error);
    return Promise.resolve();
  }

  findReceivedById(
    id: string,
  ): Promise<CapReceivedEvent<JsonValue> | undefined> {
    const event = this.store.get(id);
    return Promise.resolve(event ? { ...event } : undefined);
  }

  listReceived(
    options: {
      limit?: number;
      offset?: number;
      topic?: string;
      due?: boolean;
    } = {},
  ): Promise<{ items: CapReceivedEvent<JsonValue>[]; total: number }> {
    let all = [...this.store.values()];
    if (options.topic) {
      all = all.filter((event) => event.topic === options.topic);
    }
    if (options.due) {
      const now = Date.now();
      all = all.filter(
        (event) =>
          event.status === 'failed' &&
          event.nextRetry &&
          event.nextRetry.getTime() <= now,
      );
    }
    const total = all.length;
    const offset = options.offset ?? 0;
    return Promise.resolve({
      items: all.slice(offset, offset + (options.limit ?? total)),
      total,
    });
  }

  private dedupeIdentity(
    event: Pick<CapReceivedEvent, 'group' | 'dedupeKey'>,
  ): string {
    return `${event.group}|${event.dedupeKey}`;
  }
}

export function createInMemoryReceivedStorage(): InMemoryReceivedStorage {
  return new InMemoryReceivedStorage();
}
