import { type CapHeaders } from '../models/cap-headers.type';
import {
  type CapHandler,
  type SubscribeMetadata,
  type SubscriberPort,
} from '../ports/subscriber.port';

export class FakeSubscriber implements SubscriberPort {
  readonly listeners = new Map<string, Set<CapHandler>>();

  consume(topic: string, group: string, handler: CapHandler): Promise<void> {
    const key = `${topic}|${group}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)?.add(handler);
    return Promise.resolve();
  }

  async deliver(
    topic: string,
    group: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: SubscribeMetadata,
  ): Promise<void> {
    const handlers = this.listeners.get(`${topic}|${group}`) ?? [];
    for (const handler of handlers) {
      await handler(payload, headers, metadata);
    }
  }
}

export function createInMemorySubscriber(): FakeSubscriber {
  return new FakeSubscriber();
}
