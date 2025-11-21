/* eslint-disable @typescript-eslint/unbound-method */
import { RetrySchedulerService } from './schedule.service';
import {
  createInMemoryPublishStorage,
  createInMemoryPublisher,
  createInMemoryReceivedStorage,
} from '../testing/test-helpers';

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

    // spy on key methods
    jest.spyOn(pubStore, 'getUnpublished');
    jest.spyOn(pubStore, 'markPublished');
    jest.spyOn(publisher, 'emit');
    jest.spyOn(recStore, 'getRetryDue');
    jest.spyOn(cap, 'retryReceived');

    svc = new RetrySchedulerService(pubStore, publisher, recStore, cap as any);
  });

  it('flushOutbox publishes unpublished messages and marks published', async () => {
    const evt = { id: '1', topic: 't', payload: { a: 1 } } as any;
    (pubStore.getUnpublished as jest.Mock).mockResolvedValueOnce([evt]);

    await svc.flushOutbox();

    expect(publisher.emit).toHaveBeenCalledWith('t', { a: 1 });
    expect(pubStore.markPublished).toHaveBeenCalledWith('1');
  });

  it('flushOutbox leaves record when publish fails', async () => {
    const evt = { id: '2', topic: 't2', payload: {} } as any;
    (pubStore.getUnpublished as jest.Mock).mockResolvedValueOnce([evt]);
    (publisher.emit as jest.Mock).mockRejectedValueOnce(new Error('net'));

    await svc.flushOutbox();

    // markPublished should not be called on failure
    expect(pubStore.markPublished).not.toHaveBeenCalled();
  });

  it('retryInbox calls cap.retryReceived for due messages', async () => {
    const rec = { id: 'r1', topic: 'x', group: 'g' } as any;
    (recStore.getRetryDue as jest.Mock).mockResolvedValueOnce([rec]);

    await svc.retryInbox();

    expect(cap.retryReceived).toHaveBeenCalledWith(rec);
  });
});
