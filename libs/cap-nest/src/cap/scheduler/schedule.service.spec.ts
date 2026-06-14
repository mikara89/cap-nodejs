/* eslint-disable @typescript-eslint/unbound-method */
import { RetrySchedulerService } from './schedule.service';
import {
  createInMemoryPublishStorage,
  createInMemoryPublisher,
  createInMemoryReceivedStorage,
} from '../testing/test-helpers';

const schedulerOptions = {
  batchSize: 200,
  leaseMs: 30_000,
  maxRetries: 3,
  instanceId: 'test-instance',
  disabled: false,
};

describe('RetrySchedulerService', () => {
  let svc: RetrySchedulerService;
  let pubStore = createInMemoryPublishStorage();
  let publisher = createInMemoryPublisher();
  let recStore = createInMemoryReceivedStorage();
  let cap = { retryReceived: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    pubStore = createInMemoryPublishStorage();
    publisher = createInMemoryPublisher();
    recStore = createInMemoryReceivedStorage();
    cap = { retryReceived: jest.fn().mockResolvedValue(undefined) };

    jest.spyOn(pubStore, 'claimUnpublished');
    jest.spyOn(pubStore, 'markPublished');
    jest.spyOn(pubStore, 'markPublishFailed');
    jest.spyOn(pubStore, 'releaseExpiredClaims');
    jest.spyOn(publisher, 'emit');
    jest.spyOn(recStore, 'getRetryDue');
    jest.spyOn(cap, 'retryReceived');

    svc = new RetrySchedulerService(
      pubStore,
      publisher,
      recStore,
      cap as any,
      schedulerOptions,
    );
  });

  it('flushOutbox claims, publishes, and marks published', async () => {
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
      { traceId: 'abc' },
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

    expect(pubStore.markPublished).not.toHaveBeenCalled();
    expect(pubStore.markPublishFailed).toHaveBeenCalledWith(
      '2',
      expect.any(Error),
      expect.objectContaining({ maxRetries: 3 }),
    );
  });

  it('retryInbox calls cap.retryReceived for due messages', async () => {
    const rec = {
      id: 'r1',
      topic: 'x',
      group: 'g',
      messageId: 'm1',
      dedupeKey: 'x|g|m1',
      occurredAt: new Date().toISOString(),
      payload: {},
      retryCount: 1,
      processed: false,
      nextRetry: new Date(Date.now() - 1),
    };
    await recStore.trySaveReceived(rec);
    (recStore.getRetryDue as jest.Mock).mockResolvedValueOnce([rec]);

    await svc.retryInbox();

    expect(cap.retryReceived).toHaveBeenCalledWith(rec);
  });
});
