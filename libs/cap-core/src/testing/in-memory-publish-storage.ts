import { type CapPublishEvent } from '../models/cap-publish-event';
import { type JsonValue } from '../models/json-value.type';
import {
  type ClaimUnpublishedOptions,
  type MarkPublishFailedOptions,
  type PublishStoragePort,
} from '../ports/publish-storage.port';

export class InMemoryPublishStorage implements PublishStoragePort {
  readonly store = new Map<string, CapPublishEvent<JsonValue>>();

  savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
  ): Promise<string> {
    this.store.set(event.id, event);
    return Promise.resolve(event.id);
  }

  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent<JsonValue>[]> {
    const claimed: CapPublishEvent<JsonValue>[] = [];
    for (const event of this.store.values()) {
      if (claimed.length >= options.limit) break;
      if (!isClaimable(event, options.now)) continue;
      event.status = 'processing';
      event.lockedBy = options.lockedBy;
      event.lockedUntil = options.lockUntil;
      claimed.push({ ...event });
    }
    return Promise.resolve(claimed);
  }

  markPublished(id: string, publishedAt = new Date()): Promise<void> {
    const event = this.store.get(id);
    if (!event) return Promise.resolve();
    event.status = 'published';
    event.publishedAt = publishedAt;
    event.lockedBy = null;
    event.lockedUntil = null;
    return Promise.resolve();
  }

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void> {
    const event = this.store.get(id);
    if (!event) return Promise.resolve();
    event.retryCount += 1;
    event.status =
      event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
    event.nextRetryAt =
      event.status === 'dead_letter' ? null : options.nextRetryAt;
    event.lastError = error instanceof Error ? error.message : String(error);
    event.lockedBy = null;
    event.lockedUntil = null;
    return Promise.resolve();
  }

  releaseExpiredClaims(now: Date): Promise<void> {
    for (const event of this.store.values()) {
      if (
        event.status === 'processing' &&
        event.lockedUntil &&
        event.lockedUntil <= now
      ) {
        event.status = 'failed';
        event.lockedBy = null;
        event.lockedUntil = null;
      }
    }
    return Promise.resolve();
  }

  findPublishById(id: string): Promise<CapPublishEvent<JsonValue> | undefined> {
    const event = this.store.get(id);
    return Promise.resolve(event ? { ...event } : undefined);
  }

  listPublish(
    options: {
      limit?: number;
      offset?: number;
      topic?: string;
      onlyUnpublished?: boolean;
    } = {},
  ): Promise<{ items: CapPublishEvent<JsonValue>[]; total: number }> {
    let filtered = [...this.store.values()];
    if (options.topic) {
      filtered = filtered.filter((event) => event.topic === options.topic);
    }
    if (options.onlyUnpublished) {
      filtered = filtered.filter((event) => isClaimable(event, new Date()));
    }
    const total = filtered.length;
    const offset = options.offset ?? 0;
    return Promise.resolve({
      items: filtered.slice(offset, offset + (options.limit ?? total)),
      total,
    });
  }
}

export function createInMemoryPublishStorage(): InMemoryPublishStorage {
  return new InMemoryPublishStorage();
}

function isClaimable(event: CapPublishEvent, now: Date): boolean {
  if (event.status === 'pending') return true;
  if (event.status === 'failed') {
    return !event.nextRetryAt || event.nextRetryAt <= now;
  }
  if (event.status === 'processing') {
    return Boolean(event.lockedUntil && event.lockedUntil <= now);
  }
  return false;
}
