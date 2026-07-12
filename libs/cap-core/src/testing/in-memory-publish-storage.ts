import { type CapPublishEvent } from '../models/cap-publish-event';
import {
  type CapStorageCapabilities,
  type CapabilityAwareStoragePort,
} from '../models/cap-storage-capabilities';
import { type CapOperationContext } from '../models/cap-operation-context';
import { type JsonValue } from '../models/json-value.type';
import {
  type ClaimUnpublishedOptions,
  type MarkPublishFailedOptions,
  type PublishClaimOwnership,
  type PublishStoragePort,
  type RenewPublishClaimOptions,
} from '../ports/publish-storage.port';

export class InMemoryPublishStorage
  implements PublishStoragePort, CapabilityAwareStoragePort
{
  readonly store = new Map<string, CapPublishEvent<JsonValue>>();

  savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    _ctx?: CapOperationContext,
  ): Promise<string> {
    this.store.set(event.id, event);
    return Promise.resolve(event.id);
  }

  getCapabilities(): CapStorageCapabilities {
    return {
      transactions: false,
      skipLockedClaiming: false,
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
      advisoryLocks: false,
      atomicInsertIgnore: false,
      nestedTransactions: false,
      isolationLevels: [],
    };
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

  markPublished(
    id: string,
    publishedAt = new Date(),
    ownership: PublishClaimOwnership = {},
  ): Promise<boolean> {
    const event = this.store.get(id);
    if (!event || !ownsClaim(event, ownership.expectedLockedBy)) {
      return Promise.resolve(false);
    }
    event.status = 'published';
    event.publishedAt = publishedAt;
    event.lockedBy = null;
    event.lockedUntil = null;
    event.nextRetryAt = null;
    return Promise.resolve(true);
  }

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean> {
    const event = this.store.get(id);
    if (!event || !ownsClaim(event, options.expectedLockedBy)) {
      return Promise.resolve(false);
    }
    event.retryCount += 1;
    event.status =
      event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
    event.nextRetryAt =
      event.status === 'dead_letter' ? null : options.nextRetryAt;
    event.lastError = error instanceof Error ? error.message : String(error);
    event.lockedBy = null;
    event.lockedUntil = null;
    return Promise.resolve(true);
  }

  renewPublishClaim(options: RenewPublishClaimOptions): Promise<boolean> {
    const event = this.store.get(options.id);
    if (
      event?.status !== 'processing' ||
      event.lockedBy !== options.expectedLockedBy ||
      !event.lockedUntil ||
      event.lockedUntil <= options.now
    ) {
      return Promise.resolve(false);
    }
    event.lockedUntil = options.lockUntil;
    return Promise.resolve(true);
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

function ownsClaim(
  event: CapPublishEvent,
  expectedLockedBy: string | undefined,
): boolean {
  if (expectedLockedBy === undefined) return true;
  return event.status === 'processing' && event.lockedBy === expectedLockedBy;
}
