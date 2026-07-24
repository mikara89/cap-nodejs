import { CapEngine } from './cap-engine';
import { createInMemoryPublishStorage } from '../testing/in-memory-publish-storage';
import { createInMemoryReceivedStorage } from '../testing/in-memory-received-storage';
import { FakePublisher } from '../testing/fake-publisher';
import { FakeSubscriber } from '../testing/fake-subscriber';
import type { PublishStoragePort } from '../ports/publish-storage.port';
import type { ReceivedStoragePort } from '../ports/received-storage.port';

describe('CapEngine messaging administration', () => {
  const now = new Date('2026-06-16T01:00:00.000Z');

  function createEngine(
    publishStorage = createInMemoryPublishStorage(),
    receivedStorage = createInMemoryReceivedStorage(),
    publisher = new FakePublisher(),
    subscriber = new FakeSubscriber(),
  ) {
    return {
      engine: new CapEngine({
        publishStorage,
        receivedStorage,
        publisher,
        subscriber,
        now: () => now,
        idGenerator: () => 'engine-id',
        scheduler: { instanceId: 'admin-test', batchSize: 10 },
      }),
      publishStorage,
      receivedStorage,
      publisher,
      subscriber,
    };
  }

  it('delegates requeues with one injected clock value', async () => {
    const { engine, publishStorage, receivedStorage } = createEngine();
    const requeueReceived = jest.spyOn(receivedStorage, 'requeueReceived');
    const requeuePublish = jest.spyOn(publishStorage, 'requeuePublish');

    await engine.requeueInbox('inbox-id');
    await engine.requeueOutbox('outbox-id');

    expect(requeueReceived).toHaveBeenCalledWith('inbox-id', now);
    expect(requeuePublish).toHaveBeenCalledWith('outbox-id', now);
  });

  it('rejects missing administration capabilities clearly', async () => {
    const { publishStorage, receivedStorage, publisher, subscriber } =
      createEngine();
    const noInbox = Object.assign(Object.create(receivedStorage), {
      requeueReceived: undefined,
      getReceivedSnapshot: undefined,
    }) as ReceivedStoragePort;
    const noOutbox = Object.assign(Object.create(publishStorage), {
      requeuePublish: undefined,
      getPublishSnapshot: undefined,
    }) as PublishStoragePort;

    expect(() =>
      new CapEngine({
        publishStorage,
        receivedStorage: noInbox,
        publisher,
        subscriber,
      }).requeueInbox('x'),
    ).toThrow(/received storage does not support/);
    await expect(
      new CapEngine({
        publishStorage,
        receivedStorage: noInbox,
        publisher,
        subscriber,
      }).getMessagingSnapshot(),
    ).rejects.toThrow(/received storage does not support/);
    expect(() =>
      new CapEngine({
        publishStorage: noOutbox,
        receivedStorage,
        publisher,
        subscriber,
      }).requeueOutbox('x'),
    ).toThrow(/publish storage does not support/);
    await expect(
      new CapEngine({
        publishStorage: noOutbox,
        receivedStorage,
        publisher,
        subscriber,
      }).getMessagingSnapshot(),
    ).rejects.toThrow(/publish storage does not support/);
  });

  it('combines defensive inbox and outbox snapshots', async () => {
    const { engine, publishStorage, receivedStorage } = createEngine();
    const inbox = {
      counts: {
        pending: 1,
        processing: 0,
        processed: 0,
        failed: 0,
        dead_letter: 0,
      },
      oldestPendingAt: now,
      oldestFailedAt: null,
    };
    const outbox = {
      counts: {
        pending: 0,
        processing: 0,
        published: 0,
        failed: 1,
        dead_letter: 0,
      },
      oldestPendingAt: null,
      oldestFailedAt: now,
    };
    jest.spyOn(receivedStorage, 'getReceivedSnapshot').mockResolvedValue(inbox);
    jest.spyOn(publishStorage, 'getPublishSnapshot').mockResolvedValue(outbox);

    const snapshot = await engine.getMessagingSnapshot();
    snapshot.inbox.counts.pending = 99;
    snapshot.outbox.oldestFailedAt?.setUTCFullYear(2000);
    expect(inbox.counts.pending).toBe(1);
    expect(outbox.oldestFailedAt).toEqual(now);
  });

  it('uses existing retry and dispatch paths without synchronous handler or broker work', async () => {
    const { engine, publishStorage, receivedStorage, publisher } =
      createEngine();
    const handler = jest.fn();
    engine.registerSubscription('inbox-topic', 'workers', handler);
    await engine.startSubscriptions();
    receivedStorage.store.set('inbox-id', {
      id: 'inbox-id',
      topic: 'inbox-topic',
      group: 'workers',
      messageId: 'm1',
      dedupeKey: 'd1',
      occurredAt: '2026-06-16T00:00:00.000Z',
      payload: { inbox: true },
      retryCount: 2,
      status: 'dead_letter',
      processed: false,
      lastError: 'x',
      processedAt: null,
      nextRetry: null,
    });
    publishStorage.store.set('outbox-id', {
      id: 'outbox-id',
      topic: 'outbox-topic',
      occurredAt: '2026-06-16T00:00:00.000Z',
      payload: { outbox: true },
      retryCount: 2,
      status: 'dead_letter',
      nextRetryAt: null,
      lastError: 'x',
      lockedBy: null,
      lockedUntil: null,
      publishedAt: null,
    });

    await engine.requeueInbox('inbox-id');
    await engine.requeueOutbox('outbox-id');
    expect(handler).not.toHaveBeenCalled();
    expect(publisher.emitted).toHaveLength(0);

    await expect(engine.retryInboxBatch()).resolves.toBe(1);
    await expect(engine.dispatchOutboxBatch()).resolves.toBe(1);
    expect(handler).toHaveBeenCalledWith({ inbox: true }, undefined);
    expect(publisher.emitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          topic: 'outbox-topic',
          payload: { outbox: true },
        }),
      ]),
    );
  });
});
