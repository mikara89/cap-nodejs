import { Injectable } from '@nestjs/common';
import type { CapHeaders, ISubscriber } from '@mikara89/cap-nest';

type MessageHandler = (payload: unknown, headers?: CapHeaders) => Promise<void>;

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
  ): Promise<void> {
    const resolved = unwrapMessage(message, headers);
    const handlers = this.handlers.get(this.getKey(topic, group));
    if (!handlers?.size) return;

    await Promise.all(
      [...handlers].map((handler) =>
        handler(resolved.payload, resolved.headers),
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
): { payload: unknown; headers?: CapHeaders } {
  if (explicitHeaders) {
    return { payload: message, headers: explicitHeaders };
  }

  if (
    message &&
    typeof message === 'object' &&
    'payload' in message &&
    'headers' in message
  ) {
    const wrapped = message as { payload: unknown; headers?: CapHeaders };
    return { payload: wrapped.payload, headers: wrapped.headers };
  }

  return { payload: message };
}
