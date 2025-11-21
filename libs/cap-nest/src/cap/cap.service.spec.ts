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

    // create spies on important methods to assert calls in tests
    jest.spyOn(publisher, 'emit');
    jest.spyOn(pubStore, 'savePublish');
    jest.spyOn(pubStore, 'markPublished');
    jest.spyOn(recStore, 'saveReceived');
    jest.spyOn(recStore, 'markProcessed');
    jest.spyOn(recStore, 'scheduleRetry');

    cap = new CapService(pubStore, recStore, publisher, subscriber);
  });

  it('publish - success marks published', async () => {
    await cap.publish('t1', { a: 1 });

    expect(pubStore.savePublish).toHaveBeenCalled();
    expect(publisher.emit).toHaveBeenCalledWith('t1', { a: 1 }, undefined);
    expect(pubStore.markPublished).toHaveBeenCalled();
  });

  it('publish - transport failure leaves unpublished', async () => {
    (publisher.emit as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    await cap.publish('t2', { b: 2 });

    expect(pubStore.savePublish).toHaveBeenCalled();
    expect(publisher.emit).toHaveBeenCalledWith('t2', { b: 2 }, undefined);
    expect(pubStore.markPublished).not.toHaveBeenCalled();
  });

  it('subscribe - handler processed successfully and persisted', async () => {
    const handler = jest.fn(async () => {
      // simulate processing
      return Promise.resolve();
    });

    // attach a handler using cap.subscribe
    cap.subscribe('topic-x', 'group-1', handler);

    // trigger the subscriber's onMessage
    const handlers = subscriber.listeners.get('topic-x|group-1');
    expect(handlers).toBeDefined();
    for (const fn of handlers!) await fn({ foo: 'bar' });

    // persisted and processed
    expect(recStore.saveReceived).toHaveBeenCalled();
    expect(recStore.markProcessed).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('subscribe - handler failure schedules retry', async () => {
    const handler = jest.fn(async () => {
      throw new Error('handler fail');
    });

    cap.subscribe('topic-retry', 'group-r', handler);

    const handlers2 = subscriber.listeners.get('topic-retry|group-r');
    expect(handlers2).toBeDefined();
    for (const fn of handlers2!) await fn({ z: 9 });

    expect(recStore.saveReceived).toHaveBeenCalled();
    // after failure, scheduleRetry should be called
    expect(recStore.scheduleRetry).toHaveBeenCalled();
    const scheduleSpy = recStore.scheduleRetry as jest.Mock;
    const args = scheduleSpy.mock.calls[0];
    // args: id, retryCount, nextRetry(Date)
    expect(typeof args[0]).toBe('string');
    expect(args[1]).toBe(1);
    expect(args[2] instanceof Date).toBe(true);
  });

  it('publish - uses transactional save when tx provided and storage supports it', async () => {
    const tx = { em: 'fake-tx' };
    const transactionalPubStore: any = {
      savePublish: jest.fn(),
      savePublishWithTx: jest.fn().mockResolvedValue('tx-id-1'),
      markPublished: jest.fn(),
      getUnpublished: jest.fn(),
    };

    // keep the same recStore/publisher/subscriber
    cap = new CapService(
      transactionalPubStore,
      recStore,
      publisher,
      subscriber,
    );

    await cap.publish('t-tx', { tx: true }, undefined, tx);

    expect(transactionalPubStore.savePublishWithTx).toHaveBeenCalled();
    expect(transactionalPubStore.savePublish).not.toHaveBeenCalled();
  });
});
