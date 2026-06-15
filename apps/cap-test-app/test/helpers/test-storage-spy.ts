import {
  type ClaimUnpublishedOptions,
  type IPublishStorage,
  type IReceivedStorage,
  type MarkPublishFailedOptions,
  type MarkReceivedFailedOptions,
  type CapPublishEvent,
  type CapReceivedEvent,
  type TrySaveReceivedResult,
  type JsonValue,
} from '@mikara89/cap-nest';

export class TestStorageSpy implements IPublishStorage, IReceivedStorage {
  private publishEvents = new Map<string, CapPublishEvent<JsonValue>>();
  private receivedEvents = new Map<string, CapReceivedEvent<JsonValue>>();
  private receivedDedupe = new Map<string, string>();

  public savePublishCalls: CapPublishEvent[] = [];
  public trySaveReceivedCalls: CapReceivedEvent[] = [];
  public claimUnpublishedCalls: ClaimUnpublishedOptions[] = [];
  public markPublishedCalls: string[] = [];
  public markPublishFailedCalls: Array<{
    id: string;
    error: unknown;
    options: MarkPublishFailedOptions;
  }> = [];
  public releaseExpiredClaimsCalls: Date[] = [];
  public getRetryDueCalls = 0;
  public markProcessedCalls: string[] = [];
  public markReceivedFailedCalls: Array<{
    id: string;
    error: unknown;
    options: MarkReceivedFailedOptions;
  }> = [];

  savePublish<T = JsonValue>(evt: CapPublishEvent<T>): Promise<string> {
    this.savePublishCalls.push(evt as CapPublishEvent);
    this.publishEvents.set(evt.id, evt as CapPublishEvent<JsonValue>);
    return Promise.resolve(evt.id);
  }

  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent[]> {
    this.claimUnpublishedCalls.push(options);
    const claimed: CapPublishEvent[] = [];
    for (const event of this.publishEvents.values()) {
      if (claimed.length >= options.limit) break;
      if (!this.isClaimable(event, options.now)) continue;
      event.status = 'processing';
      event.lockedBy = options.lockedBy;
      event.lockedUntil = options.lockUntil;
      claimed.push({ ...event });
    }
    return Promise.resolve(claimed);
  }

  markPublished(id: string, publishedAt = new Date()): Promise<void> {
    this.markPublishedCalls.push(id);
    const event = this.publishEvents.get(id);
    if (event) {
      event.status = 'published';
      event.publishedAt = publishedAt;
      event.lockedBy = null;
      event.lockedUntil = null;
    }
    return Promise.resolve();
  }

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void> {
    this.markPublishFailedCalls.push({ id, error, options });
    const event = this.publishEvents.get(id);
    if (event) {
      event.retryCount += 1;
      event.status =
        event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetryAt =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
      event.lockedBy = null;
      event.lockedUntil = null;
    }
    return Promise.resolve();
  }

  releaseExpiredClaims(now: Date): Promise<void> {
    this.releaseExpiredClaimsCalls.push(now);
    for (const event of this.publishEvents.values()) {
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

  trySaveReceived<T extends JsonValue = JsonValue>(
    evt: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    this.trySaveReceivedCalls.push(evt);
    const existingId = this.receivedDedupe.get(evt.dedupeKey);
    if (existingId) {
      return Promise.resolve({
        inserted: false,
        id: existingId,
        event: this.receivedEvents.get(existingId) as CapReceivedEvent<T>,
      });
    }
    this.receivedEvents.set(evt.id, evt);
    this.receivedDedupe.set(evt.dedupeKey, evt.id);
    return Promise.resolve({ inserted: true, id: evt.id, event: evt });
  }

  getRetryDue(limit: number): Promise<CapReceivedEvent[]> {
    this.getRetryDueCalls++;
    const now = new Date();
    const due = Array.from(this.receivedEvents.values())
      .filter((e) => e.status === 'failed' && e.nextRetry && e.nextRetry <= now)
      .slice(0, limit);
    return Promise.resolve(due);
  }

  markProcessed(id: string): Promise<void> {
    this.markProcessedCalls.push(id);
    const event = this.receivedEvents.get(id);
    if (event) {
      event.status = 'processed';
      event.processed = true;
      event.processedAt = new Date();
      event.nextRetry = null;
    }
    return Promise.resolve();
  }

  markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    this.markReceivedFailedCalls.push({ id, error, options });
    const event = this.receivedEvents.get(id);
    if (event) {
      event.retryCount += 1;
      event.status =
        event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetry =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
    }
    return Promise.resolve();
  }

  getPublishEvent(id: string): CapPublishEvent | undefined {
    return this.publishEvents.get(id);
  }

  getReceivedEvent(id: string): CapReceivedEvent | undefined {
    return this.receivedEvents.get(id);
  }

  getAllPublishEvents(): CapPublishEvent[] {
    return Array.from(this.publishEvents.values());
  }

  getAllReceivedEvents(): CapReceivedEvent[] {
    return Array.from(this.receivedEvents.values());
  }

  reset(): void {
    this.publishEvents.clear();
    this.receivedEvents.clear();
    this.receivedDedupe.clear();
    this.savePublishCalls = [];
    this.trySaveReceivedCalls = [];
    this.claimUnpublishedCalls = [];
    this.markPublishedCalls = [];
    this.markPublishFailedCalls = [];
    this.releaseExpiredClaimsCalls = [];
    this.getRetryDueCalls = 0;
    this.markProcessedCalls = [];
    this.markReceivedFailedCalls = [];
  }

  private isClaimable(event: CapPublishEvent, now: Date): boolean {
    if (event.status === 'pending') return true;
    if (event.status === 'failed') {
      return !event.nextRetryAt || event.nextRetryAt <= now;
    }
    if (event.status === 'processing') {
      return Boolean(event.lockedUntil && event.lockedUntil <= now);
    }
    return false;
  }
}
