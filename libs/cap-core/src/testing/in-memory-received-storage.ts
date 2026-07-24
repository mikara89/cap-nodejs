import { type CapReceivedEvent } from '../models/cap-received-event';
import {
  type CapInboxSnapshot,
  type CapRequeueResult,
} from '../models/cap-messaging-administration';
import { type JsonValue } from '../models/json-value.type';
import {
  type MarkReceivedFailedOptions,
  type ReceivedStorageAdministrationPort,
  type ReceivedStoragePort,
  type TrySaveReceivedResult,
} from '../ports/received-storage.port';

export class InMemoryReceivedStorage
  implements ReceivedStoragePort, ReceivedStorageAdministrationPort
{
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
          const leftCreatedAt = new Date(left.occurredAt).getTime();
          const rightCreatedAt = new Date(right.occurredAt).getTime();
          if (leftCreatedAt !== rightCreatedAt) {
            return leftCreatedAt - rightCreatedAt;
          }
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

  requeueReceived(
    id: string,
    now = new Date(),
  ): Promise<CapRequeueResult<CapReceivedEvent['status']>> {
    const event = this.store.get(id);
    if (!event) return Promise.resolve({ id, outcome: 'not_found' });
    const previousStatus = event.status;
    if (previousStatus !== 'failed' && previousStatus !== 'dead_letter') {
      return Promise.resolve({ id, outcome: 'not_eligible', previousStatus });
    }
    event.status = 'failed';
    event.retryCount = 0;
    event.lastError = null;
    event.nextRetry = new Date(now);
    event.processed = false;
    event.processedAt = null;
    return Promise.resolve({ id, outcome: 'requeued', previousStatus });
  }

  getReceivedSnapshot(): Promise<CapInboxSnapshot> {
    const counts: CapInboxSnapshot['counts'] = {
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      dead_letter: 0,
    };
    let oldestPendingAt: Date | null = null;
    let oldestFailedAt: Date | null = null;
    for (const event of this.store.values()) {
      counts[event.status] += 1;
      const occurredAt = new Date(event.occurredAt);
      if (
        event.status === 'pending' &&
        (!oldestPendingAt || occurredAt < oldestPendingAt)
      )
        oldestPendingAt = occurredAt;
      if (
        event.status === 'failed' &&
        (!oldestFailedAt || occurredAt < oldestFailedAt)
      )
        oldestFailedAt = occurredAt;
    }
    return Promise.resolve({
      counts: { ...counts },
      oldestPendingAt,
      oldestFailedAt,
    });
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
