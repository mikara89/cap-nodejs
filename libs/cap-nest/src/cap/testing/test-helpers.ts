import {
  type IPublisher,
  type ISubscriber,
} from '../abstractions/transport.interface';
import {
  type IPublishStorage,
  type IReceivedStorage,
} from '../abstractions/storage.interface';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';

// Typed in-memory spy implementations for tests
export function createInMemoryPublisher(): IPublisher & {
  emitted: Array<{ topic: string; payload: unknown }>;
} {
  const emitted: Array<{ topic: string; payload: unknown }> = [];
  const pub: IPublisher & {
    emitted: Array<{ topic: string; payload: unknown }>;
  } = {
    emitted,
    async emit(topic: string, payload: unknown) {
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
    async consume(
      topic: string,
      group: string,
      onMessage: (payload: unknown) => Promise<void>,
    ) {
      const key = `${topic}|${group}`;
      if (!listeners.has(key)) listeners.set(key, new Set());
      const topicListeners = listeners.get(key);
      if (!topicListeners)
        throw new Error('InMemorySubscriber: topicListeners missing');
      topicListeners.add(onMessage);
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
    saveReceived(e: CapReceivedEvent<unknown>) {
      store.set(e.id, e);
      return Promise.resolve(e.id);
    },
    markProcessed(id: string) {
      const ev = store.get(id);
      if (ev) ev.processed = true;
      return Promise.resolve();
    },
    getRetryDue(limit: number) {
      const now = Date.now();
      const list = [...store.values()]
        .filter(
          (r) => !r.processed && r.nextRetry && r.nextRetry.getTime() <= now,
        )
        .slice(0, limit);
      return Promise.resolve(list);
    },
    scheduleRetry(id: string, retryCount: number, nextRetry: Date) {
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
