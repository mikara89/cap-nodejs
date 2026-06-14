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
    async emit(
      topic: string,
      payload: unknown,
      headers?: CapHeaders,
      metadata?: CapPublishMetadata,
    ) {
      emitted.push({ topic, payload, headers, metadata });
    },
  };
}

export function createInMemorySubscriber(): ISubscriber & {
  listeners: Map<
    string,
    Set<
      (
        p: unknown,
        h?: CapHeaders,
        m?: CapDeliveryMetadata,
      ) => Promise<void>
    >
  >;
} {
  const listeners = new Map<
    string,
    Set<
      (
        p: unknown,
        h?: CapHeaders,
        m?: CapDeliveryMetadata,
      ) => Promise<void>
    >
  >();
  return {
    listeners,
    async consume(topic, group, onMessage) {
      const key = `${topic}|${group}`;
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)?.add(onMessage);
    },
  };
}

export function createInMemoryPublishStorage(): IPublishStorage & {
  store: Map<string, CapPublishEvent<JsonValue>>;
} {
  const store = new Map<string, CapPublishEvent<JsonValue>>();
  return {
    store,
    async savePublish(e) {
      store.set(e.id, e as CapPublishEvent<JsonValue>);
      return e.id;
    },
    async claimUnpublished(options: ClaimUnpublishedOptions) {
      const claimed: CapPublishEvent<JsonValue>[] = [];
      for (const event of store.values()) {
        if (claimed.length >= options.limit) break;
        if (!isClaimable(event, options.now)) continue;
        event.status = 'processing';
        event.lockedBy = options.lockedBy;
        event.lockedUntil = options.lockUntil;
        claimed.push({ ...event });
      }
      return claimed;
    },
    async markPublished(id, publishedAt = new Date()) {
      const ev = store.get(id);
      if (!ev) return;
      ev.status = 'published';
      ev.publishedAt = publishedAt;
      ev.lockedBy = null;
      ev.lockedUntil = null;
    },
    async markPublishFailed(
      id: string,
      error: unknown,
      options: MarkPublishFailedOptions,
    ) {
      const ev = store.get(id);
      if (!ev) return;
      ev.retryCount += 1;
      ev.status = ev.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      ev.nextRetryAt = ev.status === 'dead_letter' ? null : options.nextRetryAt;
      ev.lastError = error instanceof Error ? error.message : String(error);
      ev.lockedBy = null;
      ev.lockedUntil = null;
    },
    async releaseExpiredClaims(now: Date) {
      for (const ev of store.values()) {
        if (ev.status === 'processing' && ev.lockedUntil && ev.lockedUntil <= now) {
          ev.status = 'failed';
          ev.lockedBy = null;
          ev.lockedUntil = null;
        }
      }
    },
  };
}

export function createInMemoryReceivedStorage(): IReceivedStorage & {
  store: Map<string, CapReceivedEvent<JsonValue>>;
} {
  const store = new Map<string, CapReceivedEvent<JsonValue>>();
  const dedupe = new Map<string, string>();
  return {
    store,
    async trySaveReceived<T extends JsonValue = JsonValue>(
      e: CapReceivedEvent<T>,
    ): Promise<TrySaveReceivedResult<T>> {
      const existingId = dedupe.get(e.dedupeKey);
      if (existingId) {
        return {
          inserted: false,
          id: existingId,
          event: store.get(existingId) as CapReceivedEvent<T>,
        };
      }
      store.set(e.id, e as CapReceivedEvent<JsonValue>);
      dedupe.set(e.dedupeKey, e.id);
      return { inserted: true, id: e.id, event: e };
    },
    async markProcessed(id: string) {
      const ev = store.get(id);
      if (ev) ev.processed = true;
    },
    async getRetryDue(limit: number) {
      const now = Date.now();
      return [...store.values()]
        .filter(
          (r) => !r.processed && r.nextRetry && r.nextRetry.getTime() <= now,
        )
        .slice(0, limit);
    },
    async scheduleRetry(id: string, retryCount: number, nextRetry: Date) {
      const ev = store.get(id);
      if (ev) {
        ev.retryCount = retryCount;
        ev.nextRetry = nextRetry;
      }
    },
  };
}

function isClaimable(event: CapPublishEvent, now: Date): boolean {
  if (event.status === 'pending') return true;
  if (event.status === 'failed') return !event.nextRetryAt || event.nextRetryAt <= now;
  if (event.status === 'processing') {
    return Boolean(event.lockedUntil && event.lockedUntil <= now);
  }
  return false;
}
