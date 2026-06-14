/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/require-await */
import { CapService } from './cap.service';
import {
  createInMemoryPublisher,
  createInMemorySubscriber,
  createInMemoryPublishStorage,
  createInMemoryReceivedStorage,
} from './testing/test-helpers';

describe('CapService (unit)', () => {
  let cap: CapService;
  let pubStore: ReturnType<typeof createInMemoryPublishStorage>;
  let recStore: ReturnType<typeof createInMemoryReceivedStorage>;
  let publisher: ReturnType<typeof createInMemoryPublisher>;
  let subscriber: ReturnType<typeof createInMemorySubscriber>;

  beforeEach(() => {
    pubStore = createInMemoryPublishStorage();
    recStore = createInMemoryReceivedStorage();
    publisher = createInMemoryPublisher();
    subscriber = createInMemorySubscriber();

    jest.spyOn(publisher, 'emit');
    jest.spyOn(pubStore, 'savePublish');
    jest.spyOn(pubStore, 'markPublished');
    jest.spyOn(pubStore, 'markPublishFailed');
    jest.spyOn(recStore, 'trySaveReceived');
    jest.spyOn(recStore, 'markProcessed');
    jest.spyOn(recStore, 'scheduleRetry');

    cap = new CapService(pubStore, recStore, publisher, subscriber);
  });

  it('publish - success marks published and forwards cap message id', async () => {
    await cap.publish('t1', { a: 1 }, { headers: { traceId: 'abc' } });

    expect(pubStore.savePublish).toHaveBeenCalled();
    const emitCall = (publisher.emit as jest.Mock).mock.calls[0];
    expect(emitCall[0]).toBe('t1');
    expect(emitCall[1]).toEqual({ a: 1 });
    expect(emitCall[2]).toMatchObject({ traceId: 'abc' });
    expect(emitCall[2]['cap-message-id']).toEqual(expect.any(String));
    expect(emitCall[3]).toEqual({ messageId: emitCall[2]['cap-message-id'] });
    expect(pubStore.markPublished).toHaveBeenCalled();
  });

  it('publish - transport failure marks publish failed', async () => {
    (publisher.emit as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    await cap.publish('t2', { b: 2 });

    expect(pubStore.savePublish).toHaveBeenCalled();
    expect(pubStore.markPublished).not.toHaveBeenCalled();
    expect(pubStore.markPublishFailed).toHaveBeenCalled();
  });

  it('subscribe - handler processed successfully and persisted', async () => {
    const handler = jest.fn(async () => undefined);

    cap.subscribe('topic-x', 'group-1', handler);

    const handlers = subscriber.listeners.get('topic-x|group-1');
    expect(handlers).toBeDefined();
    for (const fn of handlers!) {
      await fn({ foo: 'bar' }, { traceId: 'sub' }, { messageId: 'msg-1' });
    }

    expect(recStore.trySaveReceived).toHaveBeenCalled();
    expect(recStore.markProcessed).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' }, { traceId: 'sub' });
  });

  it('subscribe - duplicate delivery is persisted once and skipped', async () => {
    const handler = jest.fn(async () => undefined);

    cap.subscribe('topic-x', 'group-1', handler);

    const handlers = subscriber.listeners.get('topic-x|group-1');
    expect(handlers).toBeDefined();
    for (const fn of handlers!) {
      await fn({ foo: 'bar' }, undefined, { messageId: 'dup-1' });
      await fn({ foo: 'bar' }, undefined, { messageId: 'dup-1' });
    }

    expect(recStore.trySaveReceived).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('subscribe - handler failure schedules retry', async () => {
    const handler = jest.fn(async () => {
      throw new Error('handler fail');
    });

    cap.subscribe('topic-retry', 'group-r', handler);

    const handlers = subscriber.listeners.get('topic-retry|group-r');
    expect(handlers).toBeDefined();
    for (const fn of handlers!)
      await fn({ z: 9 }, undefined, { messageId: 'm-r' });

    expect(recStore.trySaveReceived).toHaveBeenCalled();
    expect(recStore.scheduleRetry).toHaveBeenCalled();
    const args = (recStore.scheduleRetry as jest.Mock).mock.calls[0];
    expect(typeof args[0]).toBe('string');
    expect(args[1]).toBe(1);
    expect(args[2] instanceof Date).toBe(true);
  });

  it('publish - tx without immediate only stores outbox row', async () => {
    const tx = { em: 'fake-tx' };
    const transactionalPubStore: any = {
      savePublish: jest.fn(),
      savePublishWithTx: jest.fn().mockResolvedValue('tx-id-1'),
      markPublished: jest.fn(),
      markPublishFailed: jest.fn(),
      claimUnpublished: jest.fn(),
      releaseExpiredClaims: jest.fn(),
    };

    cap = new CapService(
      transactionalPubStore,
      recStore,
      publisher,
      subscriber,
    );

    await cap.publish('t-tx', { tx: true }, { tx });

    expect(transactionalPubStore.savePublishWithTx).toHaveBeenCalled();
    expect(transactionalPubStore.savePublish).not.toHaveBeenCalled();
    expect(publisher.emit).not.toHaveBeenCalled();
  });
});
