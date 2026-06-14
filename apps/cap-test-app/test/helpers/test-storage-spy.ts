import {
  type IPublishStorage,
  type IReceivedStorage,
  type CapPublishEvent,
  type CapReceivedEvent,
} from '@mikara89/cap-nest';

/**
 * In-memory storage implementation with spy capabilities for testing.
 * Tracks all method calls and provides access to internal state.
 */
export class TestStorageSpy implements IPublishStorage, IReceivedStorage {
  // Internal storage
  private publishEvents = new Map<string, CapPublishEvent>();
  private receivedEvents = new Map<string, CapReceivedEvent>();

  // Spy tracking
  public savePublishCalls: CapPublishEvent[] = [];
  public saveReceivedCalls: CapReceivedEvent[] = [];
  public getUnpublishedCalls = 0;
  public markPublishedCalls: string[] = [];
  public getRetryDueCalls = 0;
  public markProcessedCalls: string[] = [];
  public scheduleRetryCalls: Array<{
    id: string;
    retryCount: number;
    nextRetry: Date;
  }> = [];

  // --- IPublishStorage ---

  savePublish<T = unknown>(evt: CapPublishEvent<T>): Promise<string> {
    this.savePublishCalls.push(evt);
    this.publishEvents.set(evt.id, { ...evt });
    return Promise.resolve(evt.id); // Return the message ID
  }

  getUnpublished(limit: number): Promise<CapPublishEvent[]> {
    this.getUnpublishedCalls++;
    const unpublished = Array.from(this.publishEvents.values())
      .filter((e) => e.status !== 'published')
      .slice(0, limit);
    return Promise.resolve(unpublished);
  }

  markPublished(id: string): Promise<void> {
    this.markPublishedCalls.push(id);
    const event = this.publishEvents.get(id);
    if (event) {
      event.status = 'published';
    }
    return Promise.resolve();
  }

  // --- IReceivedStorage ---

  saveReceived<T = unknown>(evt: CapReceivedEvent<T>): Promise<string> {
    this.saveReceivedCalls.push(evt);
    this.receivedEvents.set(evt.id, { ...evt });
    return Promise.resolve(evt.id); // Return the message ID
  }

  getRetryDue(limit: number): Promise<CapReceivedEvent[]> {
    this.getRetryDueCalls++;
    const now = new Date();
    const due = Array.from(this.receivedEvents.values())
      .filter((e) => !e.processed && e.nextRetry && e.nextRetry <= now)
      .slice(0, limit);
    return Promise.resolve(due);
  }

  markProcessed(id: string): Promise<void> {
    this.markProcessedCalls.push(id);
    const event = this.receivedEvents.get(id);
    if (event) {
      event.processed = true;
    }
    return Promise.resolve();
  }

  scheduleRetry(
    id: string,
    retryCount: number,
    nextRetry: Date,
  ): Promise<void> {
    this.scheduleRetryCalls.push({ id, retryCount, nextRetry });
    const event = this.receivedEvents.get(id);
    if (event) {
      event.retryCount = retryCount;
      event.nextRetry = nextRetry;
    }
    return Promise.resolve();
  }

  // --- Test helpers ---

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
    this.savePublishCalls = [];
    this.saveReceivedCalls = [];
    this.getUnpublishedCalls = 0;
    this.markPublishedCalls = [];
    this.getRetryDueCalls = 0;
    this.markProcessedCalls = [];
    this.scheduleRetryCalls = [];
  }
}
