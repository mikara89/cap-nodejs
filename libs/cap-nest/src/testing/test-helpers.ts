/* eslint-disable @typescript-eslint/require-await */
import {
  IPublisher,
  ISubscriber,
} from '../cap/abstractions/transport.interface';
import {
  IPublishStorage,
  IReceivedStorage,
} from '../cap/abstractions/storage.interface';
import { CapPublishEvent } from '../cap/models/cap-publish-event';
import { CapReceivedEvent } from '../cap/models/cap-received-event';

// Typed in-memory spy implementations for tests
export function createInMemoryPublisher(): IPublisher & {
  emitted: Array<{ topic: string; payload: unknown }>;
} {
  const emitted: Array<{ topic: string; payload: unknown }> = [];
  const pub: IPublisher & {
    emitted: Array<{ topic: string; payload: unknown }>;
  } = {
    emitted,
    emit(topic: string, payload: unknown) {
      emitted.push({ topic, payload });
      return Promise.resolve();
    },
  };
  return pub;
}

export function createInMemorySubscriber(): ISubscriber & {
  listeners: Map<string, Set<(p: unknown) => Promise<void>>>;
} {
  const listeners = new Map<string, Set<(p: unknown) => Promise<void>>>();
  const sub: ISubscriber & {
    listeners: Map<string, Set<(p: unknown) => Promise<void>>>;
  } = {
    listeners,
    consume(
      topic: string,
      _group: string,
      onMessage: (payload: unknown) => Promise<void>,
    ) {
      if (!listeners.has(topic)) listeners.set(topic, new Set());
      listeners.get(topic)!.add(onMessage);
      return Promise.resolve();
    },
  };
  return sub;
}

export function createInMemoryPublishStorage(): IPublishStorage & {
  store: Map<string, CapPublishEvent<unknown>>;
} {
  const store = new Map<string, CapPublishEvent<unknown>>();
  const st: IPublishStorage & { store: Map<string, CapPublishEvent<unknown>> } =
    {
      store,
      savePublish(e: CapPublishEvent<unknown>) {
        store.set(e.id, e);
        return Promise.resolve(e.id);
      },
      markPublished(id: string) {
        const ev = store.get(id);
        if (ev) ev.status = 'published';
        return Promise.resolve();
      },
      getUnpublished(limit: number) {
        return Promise.resolve(
          [...store.values()]
            .filter(
              (v) =>
                v.status === undefined ||
                (v.status === 'failed' && v.retryCount < 3),
            )
            .slice(0, limit),
        );
      },
    };
  return st;
}

export function createInMemoryReceivedStorage(): IReceivedStorage & {
  store: Map<string, CapReceivedEvent<unknown>>;
} {
  const store = new Map<string, CapReceivedEvent<unknown>>();
  const st: IReceivedStorage & {
    store: Map<string, CapReceivedEvent<unknown>>;
  } = {
    store,
    async saveReceived(e: CapReceivedEvent<unknown>) {
      store.set(e.id, e);
      return e.id;
    },
    async markProcessed(id: string) {
      const ev = store.get(id);
      if (ev) ev.processed = true;
      return Promise.resolve();
    },
    async getRetryDue(limit: number) {
      const now = Date.now();
      const list = [...store.values()]
        .filter(
          (r) => !r.processed && r.nextRetry && r.nextRetry.getTime() <= now,
        )
        .slice(0, limit);
      return list;
    },
    async scheduleRetry(id: string, retryCount: number, nextRetry: Date) {
      const ev = store.get(id);
      if (ev) {
        ev.retryCount = retryCount;
        ev.nextRetry = nextRetry;
      }
      return Promise.resolve();
    },
  };
  return st;
}
