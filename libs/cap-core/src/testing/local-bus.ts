import { type CapHeaders } from '../models/cap-headers.type';
import { type JsonValue } from '../models/json-value.type';
import {
  type PublishMetadata,
  type PublisherPort,
} from '../ports/publisher.port';
import {
  type SubscribeMetadata,
  type SubscriberPort,
} from '../ports/subscriber.port';

type Listener = (
  payload: unknown,
  headers?: CapHeaders,
  metadata?: SubscribeMetadata,
) => Promise<void> | void;

export class LocalBus implements PublisherPort, SubscriberPort {
  readonly listeners = new Map<string, Set<Listener>>();

  async emit<T extends JsonValue = JsonValue>(
    topic: string,
    payload: T,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void> {
    const handlers = this.listeners.get(topic);
    if (handlers && handlers.size > 0) {
      await Promise.all(
        [...handlers].map((handler) =>
          Promise.resolve(
            handler(payload, headers, {
              messageId: metadata?.messageId,
              dedupeKey: metadata?.messageId
                ? `${topic}|${metadata.messageId}`
                : undefined,
            }),
          ),
        ),
      );
    }
  }

  consume(topic: string, _group: string, handler: Listener): Promise<void> {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    this.listeners.get(topic)?.add(handler);
    return Promise.resolve();
  }
}
