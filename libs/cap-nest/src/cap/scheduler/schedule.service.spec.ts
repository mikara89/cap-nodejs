/* eslint-disable @typescript-eslint/unbound-method */
import { RetrySchedulerService } from './schedule.service';
import {
  createInMemoryPublishStorage,
  createInMemoryPublisher,
  createInMemoryReceivedStorage,
  createInMemorySubscriber,
} from '../testing/test-helpers';
import type { CapReceivedEvent } from '../models/cap-received-event';
import { CapService } from '../cap.service';

const schedulerOptions = {
  batchSize: 200,
  leaseMs: 30_000,
  maxRetries: 3,
  maxInboxRetries: 3,
  instanceId: 'test-instance',
  disabled: false,
};

describe('RetrySchedulerService', () => {
  let svc: RetrySchedulerService;
  let cap: CapService;
  let pubStore = createInMemoryPublishStorage();
  let publisher = createInMemoryPublisher();
  let recStore = createInMemoryReceivedStorage();
  let subscriber = createInMemorySubscriber();

  beforeEach(() => {
    pubStore = createInMemoryPublishStorage();
    publisher = createInMemoryPublisher();
    recStore = createInMemoryReceivedStorage();
    subscriber = createInMemorySubscriber();

    jest.spyOn(pubStore, 'claimUnpublished');
    jest.spyOn(pubStore, 'markPublished');
    jest.spyOn(pubStore, 'markPublishFailed');
    jest.spyOn(pubStore, 'releaseExpiredClaims');
    jest.spyOn(publisher, 'emit');
    jest.spyOn(recStore, 'getRetryDue');

    cap = new CapService(
      pubStore,
      recStore,
      publisher,
      subscriber,
      schedulerOptions,
    );
    jest.spyOn(cap, 'dispatchOutboxBatch');
    jest.spyOn(cap, 'retryInboxBatch');
    jest.spyOn(cap, 'retryReceived');

    svc = new RetrySchedulerService(cap, schedulerOptions);
  });

  it('flushOutbox delegates to CapService and preserves publish behavior', async () => {
    await pubStore.savePublish({
      id: '1',
      topic: 't',
      payload: { a: 1 },
      headers: { traceId: 'abc' },
      occurredAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    await svc.flushOutbox();

    expect(cap.dispatchOutboxBatch).toHaveBeenCalled();
    expect(pubStore.releaseExpiredClaims).toHaveBeenCalled();
    expect(pubStore.claimUnpublished).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 200,
        lockedBy: 'test-instance',
      }),
    );
    expect(publisher.emit).toHaveBeenCalledWith(
      't',
      { a: 1 },
      { traceId: 'abc', 'cap-message-id': '1' },
      { messageId: '1' },
    );
    expect(pubStore.markPublished).toHaveBeenCalledWith('1', expect.any(Date));
  });

  it('flushOutbox marks publish failed when emit fails', async () => {
    await pubStore.savePublish({
      id: '2',
      topic: 't2',
      payload: {},
      occurredAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });
    (publisher.emit as jest.Mock).mockRejectedValueOnce(new Error('net'));

    await svc.flushOutbox();

    expect(cap.dispatchOutboxBatch).toHaveBeenCalled();
    expect(pubStore.markPublished).not.toHaveBeenCalled();
    expect(pubStore.markPublishFailed).toHaveBeenCalledWith(
      '2',
      expect.any(Error),
      expect.objectContaining({ maxRetries: 3 }),
    );
  });

  it('retryInbox delegates to CapService and executes due retry handlers', async () => {
    const handler = jest.fn();
    cap.subscribe('x', 'g', handler);
    const rec: CapReceivedEvent = {
      id: 'r1',
      topic: 'x',
      group: 'g',
      messageId: 'm1',
      dedupeKey: 'x|g|m1',
      occurredAt: new Date().toISOString(),
      payload: {},
      retryCount: 1,
      status: 'failed',
      processed: false,
      nextRetry: new Date(Date.now() - 1),
    };
    await recStore.trySaveReceived(rec);
    (recStore.getRetryDue as jest.Mock).mockResolvedValueOnce([rec]);

    await svc.retryInbox();

    expect(cap.retryInboxBatch).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith({}, undefined);
    expect(recStore.store.get('r1')?.status).toBe('processed');
  });
});
