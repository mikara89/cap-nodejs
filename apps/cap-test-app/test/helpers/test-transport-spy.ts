import {
  type CapHeaders,
  type CapDeliveryMetadata,
  type CapPublishMetadata,
  type IPublisher,
  type ISubscriber,
} from '@mikara89/cap-nest';

type MessageHandler = (
  payload: unknown,
  headers?: CapHeaders,
  metadata?: CapDeliveryMetadata,
) => Promise<void>;

/**
 * In-memory transport implementation with spy capabilities for testing.
 * Allows manual control over message delivery and failure simulation.
 */
export class TestTransportSpy implements IPublisher, ISubscriber {
  // Spy tracking
  public emitCalls: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: CapPublishMetadata;
  }> = [];
  public consumeCalls: Array<{ topic: string; group: string }> = [];

  // Control flags
  public shouldFailEmit = false;
  public emitFailureError = new Error('Transport emit failed');

  // Internal state
  private handlers = new Map<string, MessageHandler[]>();

  // --- IPublisher ---

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: CapPublishMetadata,
  ): Promise<void> {
    this.emitCalls.push({ topic, payload, headers, metadata });

    if (this.shouldFailEmit) {
      throw this.emitFailureError;
    }

    // Simulate successful emit - notify subscribers
    await this.deliverMessage(topic, payload, headers, {
      messageId: metadata?.messageId,
    });
  }

  // --- ISubscriber ---

  consume(
    topic: string,
    group: string,
    onMessage: MessageHandler,
  ): Promise<void> {
    this.consumeCalls.push({ topic, group });

    const key = this.getHandlerKey(topic, group);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(onMessage);
    return Promise.resolve();
  }

  // --- Test helpers ---

  /**
   * Manually trigger message delivery to subscribers.
   * Useful for testing inbox pattern independently.
   */
  async deliverMessage(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: CapDeliveryMetadata,
  ): Promise<void> {
    // Deliver to all registered handlers for this topic
    const promises: Promise<void>[] = [];

    for (const [key, handlers] of this.handlers.entries()) {
      if (key.startsWith(topic + ':')) {
        for (const handler of handlers) {
          promises.push(handler(payload, headers, metadata));
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Simulate failure for the next emit call.
   */
  setEmitFailure(shouldFail: boolean, error?: Error): void {
    this.shouldFailEmit = shouldFail;
    if (error) {
      this.emitFailureError = error;
    }
  }

  /**
   * Get all handlers registered for a topic/group.
   */
  getHandlers(topic: string, group: string): MessageHandler[] {
    return this.handlers.get(this.getHandlerKey(topic, group)) ?? [];
  }

  reset(): void {
    this.emitCalls = [];
    this.consumeCalls = [];
    this.shouldFailEmit = false;
    this.emitFailureError = new Error('Transport emit failed');
    this.handlers.clear();
  }

  private getHandlerKey(topic: string, group: string): string {
    return `${topic}:${group}`;
  }
}
