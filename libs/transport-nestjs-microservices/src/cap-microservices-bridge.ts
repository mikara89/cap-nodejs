import { Injectable } from '@nestjs/common';
import type {
  CapDeliveryMetadata,
  CapHeaders,
  ISubscriber,
} from '@mikara89/cap-nest';

type MessageHandler = (
  payload: unknown,
  headers?: CapHeaders,
  metadata?: CapDeliveryMetadata,
) => Promise<void>;

@Injectable()
export class CapMicroservicesBridge implements ISubscriber {
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
    metadata?: CapDeliveryMetadata,
  ): Promise<void> {
    const resolved = unwrapMessage(message, headers, metadata);
    const handlers = this.handlers.get(this.getKey(topic, group));
    if (!handlers?.size) return;

    await Promise.all(
      [...handlers].map((handler) =>
        handler(resolved.payload, resolved.headers, resolved.metadata),
      ),
    );
  }

  private getKey(topic: string, group: string): string {
    return `${topic}|${group}`;
  }
}

function unwrapMessage(
  message: unknown,
  explicitHeaders?: CapHeaders,
  explicitMetadata?: CapDeliveryMetadata,
): { payload: unknown; headers?: CapHeaders; metadata?: CapDeliveryMetadata } {
  if (explicitHeaders) {
    return {
      payload: message,
      headers: explicitHeaders,
      metadata: explicitMetadata,
    };
  }

  if (message && typeof message === 'object' && 'payload' in message) {
    const wrapped = message as {
      payload: unknown;
      headers?: CapHeaders;
      metadata?: CapDeliveryMetadata;
    };
    return {
      payload: wrapped.payload,
      headers: wrapped.headers,
      metadata: wrapped.metadata ?? explicitMetadata,
    };
  }

  return { payload: message, metadata: explicitMetadata };
}
