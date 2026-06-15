import {
  type CapDeliveryMetadata,
  type CapPublishMetadata,
  type IPublisher,
  type ISubscriber,
} from '../abstractions/transport.interface';
import {
  type ClaimUnpublishedOptions,
  type IPublishStorage,
  type IReceivedStorage,
  type MarkReceivedFailedOptions,
  type MarkPublishFailedOptions,
  type TrySaveReceivedResult,
} from '../abstractions/storage.interface';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import { type CapHeaders } from '../models/cap-headers.type';
import { type JsonValue } from '../models/json-value.type';

export function createInMemoryPublisher(): IPublisher & {
  emitted: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: CapPublishMetadata;
  }>;
} {
  const emitted: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: CapPublishMetadata;
  }> = [];
  return {
    emitted,
    emit(
      topic: string,
      payload: unknown,
      headers?: CapHeaders,
      metadata?: CapPublishMetadata,
    ): Promise<void> {
      emitted.push({ topic, payload, headers, metadata });
      return Promise.resolve();
    },
  };
}

export function createInMemorySubscriber(): ISubscriber & {
  listeners: Map<
    string,
    Set<(p: unknown, h?: CapHeaders, m?: CapDeliveryMetadata) => Promise<void>>
  >;
} {
  const listeners = new Map<
    string,
    Set<(p: unknown, h?: CapHeaders, m?: CapDeliveryMetadata) => Promise<void>>
  >();
  return {
    listeners,
    consume(topic, group, onMessage): Promise<void> {
      const key = `${topic}|${group}`;
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)?.add(onMessage);
      return Promise.resolve();
    },
  };
}

export function createInMemoryPublishStorage(): IPublishStorage & {
  store: Map<string, CapPublishEvent<JsonValue>>;
} {
  const store = new Map<string, CapPublishEvent<JsonValue>>();
  return {
    store,
    savePublish(e) {
      store.set(e.id, e);
      return Promise.resolve(e.id);
    },
    claimUnpublished(options: ClaimUnpublishedOptions) {
      const claimed: CapPublishEvent<JsonValue>[] = [];
      for (const event of store.values()) {
        if (claimed.length >= options.limit) break;
        if (!isClaimable(event, options.now)) continue;
        event.status = 'processing';
        event.lockedBy = options.lockedBy;
        event.lockedUntil = options.lockUntil;
        claimed.push({ ...event });
      }
      return Promise.resolve(claimed);
    },
    markPublished(id, publishedAt = new Date()) {
      const ev = store.get(id);
      if (!ev) return Promise.resolve();
      ev.status = 'published';
      ev.publishedAt = publishedAt;
      ev.lockedBy = null;
      ev.lockedUntil = null;
      return Promise.resolve();
    },
    markPublishFailed(
      id: string,
      error: unknown,
      options: MarkPublishFailedOptions,
    ): Promise<void> {
      const ev = store.get(id);
      if (!ev) return Promise.resolve();
      ev.retryCount += 1;
      ev.status =
        ev.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      ev.nextRetryAt = ev.status === 'dead_letter' ? null : options.nextRetryAt;
      ev.lastError = error instanceof Error ? error.message : String(error);
      ev.lockedBy = null;
      ev.lockedUntil = null;
      return Promise.resolve();
    },
    releaseExpiredClaims(now: Date): Promise<void> {
      for (const ev of store.values()) {
        if (
          ev.status === 'processing' &&
          ev.lockedUntil &&
          ev.lockedUntil <= now
        ) {
          ev.status = 'failed';
          ev.lockedBy = null;
          ev.lockedUntil = null;
        }
      }
      return Promise.resolve();
    },
  };
}

export function createInMemoryReceivedStorage(): IReceivedStorage & {
  store: Map<string, CapReceivedEvent<JsonValue>>;
} {
  const store = new Map<string, CapReceivedEvent<JsonValue>>();
  const dedupe = new Map<string, string>();
  const dedupeIdentity = (
    event: Pick<CapReceivedEvent, 'group' | 'dedupeKey'>,
  ): string => `${event.group}|${event.dedupeKey}`;
  return {
    store,
    trySaveReceived<T extends JsonValue = JsonValue>(
      e: CapReceivedEvent<T>,
    ): Promise<TrySaveReceivedResult<T>> {
      const identity = dedupeIdentity(e);
      const existingId = dedupe.get(identity);
      if (existingId) {
        return Promise.resolve({
          inserted: false,
          id: existingId,
          event: store.get(existingId) as CapReceivedEvent<T>,
        });
      }
      store.set(e.id, e);
      dedupe.set(identity, e.id);
      return Promise.resolve({ inserted: true, id: e.id, event: e });
    },
    markProcessed(id: string): Promise<void> {
      const ev = store.get(id);
      if (ev) {
        ev.status = 'processed';
        ev.processed = true;
        ev.processedAt = new Date();
        ev.nextRetry = null;
      }
      return Promise.resolve();
    },
    getRetryDue(limit: number): Promise<CapReceivedEvent<JsonValue>[]> {
      const now = Date.now();
      return Promise.resolve(
        [...store.values()]
          .filter(
            (r) =>
              r.status === 'failed' &&
              r.nextRetry &&
              r.nextRetry.getTime() <= now,
          )
          .slice(0, limit),
      );
    },
    markReceivedFailed(
      id: string,
      error: unknown,
      options: MarkReceivedFailedOptions,
    ): Promise<void> {
      const ev = store.get(id);
      if (ev) {
        ev.retryCount += 1;
        ev.status =
          ev.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
        ev.nextRetry = ev.status === 'dead_letter' ? null : options.nextRetryAt;
        ev.lastError = error instanceof Error ? error.message : String(error);
      }
      return Promise.resolve();
    },
  };
}

function isClaimable(event: CapPublishEvent, now: Date): boolean {
  if (event.status === 'pending') return true;
  if (event.status === 'failed')
    return !event.nextRetryAt || event.nextRetryAt <= now;
  if (event.status === 'processing') {
    return Boolean(event.lockedUntil && event.lockedUntil <= now);
  }
  return false;
}
