import { Injectable } from '@nestjs/common';
import type {
  CapHeaders,
  SubscribeMetadata,
  SubscriberPort,
} from '@mikara89/cap-core';

type MessageHandler = (
  payload: unknown,
  headers?: CapHeaders,
  metadata?: SubscribeMetadata,
) => Promise<void>;

@Injectable()
export class CapMicroservicesBridge implements SubscriberPort {
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  async consume(
    topic: string,
    group: string,
    onMessage: MessageHandler,
  ): Promise<void> {
    const key = this.getKey(topic, group);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }

    this.handlers.get(key)?.add(onMessage);
    await Promise.resolve();
  }

  async dispatch(
    topic: string,
    group: string,
    message: unknown,
    headers?: CapHeaders,
    metadata?: SubscribeMetadata,
  ): Promise<void> {
    const handlers = this.handlers.get(this.getKey(topic, group));
    if (!handlers?.size) return;

    await Promise.all(
      [...handlers].map((handler) => handler(message, headers, metadata)),
    );
  }

  private getKey(topic: string, group: string): string {
    return `${topic}|${group}`;
  }
}
