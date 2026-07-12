import {
  createInMemoryPublishStorage,
  createInMemoryPublisher,
  createInMemoryReceivedStorage,
  type CapPublishEvent,
  type CapReceivedEvent,
  type PublisherPort,
} from '@mikara89/cap-core';
import { CapDashboardCoreService } from './dashboard.service';

describe('CapDashboardCoreService', () => {
  it('lists outbox messages with redacted previews', async () => {
    const publishStorage = createInMemoryPublishStorage();
    await publishStorage.savePublish(publishEvent());
    const service = newService({ publishStorage });

    const page = await service.listOutbox({ page: 1, limit: 10 });

    expect(page.total).toBe(1);
    expect(page.items[0]?.payloadPreview).toContain('[redacted]');
    expect(page.items[0]?.payloadPreview).not.toContain('secret-token');
    expect(page.items[0]?.payload).toBeUndefined();
  });

  it('returns full outbox payloads and headers with redaction', async () => {
    const publishStorage = createInMemoryPublishStorage();
    await publishStorage.savePublish(publishEvent());
    const service = newService({ publishStorage });

    const item = await service.getOutboxById('outbox-1', true);

    expect(item?.payload).toEqual({
      customerId: 'customer-1',
      auth: { token: '[redacted]' },
    });
    expect(item?.headers).toEqual({
      authorization: '[redacted]',
      traceId: 'trace-1',
    });
  });

  it('retries an outbox message through the publisher', async () => {
    const publishStorage = createInMemoryPublishStorage();
    const publisher = createInMemoryPublisher();
    await publishStorage.savePublish(publishEvent());
    const service = newService({ publishStorage, publisher });

    const result = await service.retryOutbox('outbox-1');

    expect(result.success).toBe(true);
    expect(publisher.emitted).toEqual([
      expect.objectContaining({
        topic: 'orders.created',
        metadata: { messageId: 'outbox-1' },
      }),
    ]);
    await expect(publishStorage.findPublishById('outbox-1')).resolves.toEqual(
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('retries an inbox message through the supplied retry handler', async () => {
    const receivedStorage = createInMemoryReceivedStorage();
    const received = receivedEvent();
    await receivedStorage.trySaveReceived(received);
    const retryHandler = {
      retryReceived: jest.fn().mockResolvedValue(undefined),
    };
    const service = newService({ receivedStorage, retryHandler });

    const result = await service.retryInbox('inbox-1');

    expect(result.success).toBe(true);
    expect(retryHandler.retryReceived).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'inbox-1' }),
    );
  });

  it('fences completion when bulk flushing claimed outbox rows', async () => {
    const publishStorage = createInMemoryPublishStorage();
    const publisher = createInMemoryPublisher();
    await publishStorage.savePublish(publishEvent());
    const renew = jest.spyOn(publishStorage, 'renewPublishClaim');
    const complete = jest.spyOn(publishStorage, 'markPublished');
    const service = newService({ publishStorage, publisher });

    await expect(service.flushOutbox()).resolves.toEqual({
      success: true,
      message: 'Flush complete: 1 published, 0 failed',
    });
    expect(renew).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'outbox-1',
        expectedLockedBy: expect.stringMatching(/^cap-dashboard:/),
      }),
    );
    expect(complete).toHaveBeenCalledWith('outbox-1', expect.any(Date), {
      expectedLockedBy: expect.stringMatching(/^cap-dashboard:/),
    });
  });

  it('renews the active lease throughout a long dashboard emit', async () => {
    jest.useFakeTimers();
    try {
      const publishStorage = createInMemoryPublishStorage();
      await publishStorage.savePublish(publishEvent());
      const emit = deferred<void>();
      const publisher: PublisherPort = {
        emit: jest.fn(() => emit.promise),
      };
      const renew = jest.spyOn(publishStorage, 'renewPublishClaim');
      const service = newService({ publishStorage, publisher });

      const flushing = service.flushOutbox();
      await jest.advanceTimersByTimeAsync(0);
      expect(renew).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(20_000);
      expect(renew).toHaveBeenCalledTimes(3);

      emit.resolve();
      await expect(flushing).resolves.toEqual({
        success: true,
        message: 'Flush complete: 1 published, 0 failed',
      });
      await jest.advanceTimersByTimeAsync(60_000);
      expect(renew).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });

  it('blocks mutations when read-only', async () => {
    const publishStorage = createInMemoryPublishStorage();
    const publisher = createInMemoryPublisher();
    await publishStorage.savePublish(publishEvent());
    const service = newService({
      publishStorage,
      publisher,
      options: {
        readOnly: true,
        maxPageSize: 100,
        redact: { headers: [], payloadPaths: [] },
      },
    });

    const result = await service.retryOutbox('outbox-1');

    expect(result).toEqual({
      success: false,
      message: 'Dashboard is read-only',
    });
    expect(publisher.emitted).toEqual([]);
  });
});

function newService(
  overrides: Partial<ConstructorParameters<typeof CapDashboardCoreService>[0]>,
): CapDashboardCoreService {
  return new CapDashboardCoreService({
    publishStorage: overrides.publishStorage ?? createInMemoryPublishStorage(),
    receivedStorage:
      overrides.receivedStorage ?? createInMemoryReceivedStorage(),
    options: overrides.options ?? {
      readOnly: false,
      maxPageSize: 100,
      redact: {
        headers: ['authorization'],
        payloadPaths: ['auth.token'],
      },
    },
    ...overrides,
  });
}

function publishEvent(): CapPublishEvent {
  return {
    id: 'outbox-1',
    topic: 'orders.created',
    occurredAt: '2026-06-16T10:00:00.000Z',
    payload: {
      customerId: 'customer-1',
      auth: { token: 'secret-token' },
    },
    headers: {
      authorization: 'Bearer abc',
      traceId: 'trace-1',
    },
    retryCount: 0,
    status: 'pending',
    nextRetryAt: null,
    lastError: null,
    lockedBy: null,
    lockedUntil: null,
    publishedAt: null,
  };
}

function receivedEvent(): CapReceivedEvent {
  return {
    id: 'inbox-1',
    topic: 'orders.created',
    occurredAt: '2026-06-16T10:00:00.000Z',
    payload: { orderId: 'order-1' },
    headers: { traceId: 'trace-1' },
    group: 'worker',
    messageId: 'message-1',
    dedupeKey: 'orders.created|worker|message-1',
    retryCount: 1,
    status: 'failed',
    processed: false,
    lastError: 'boom',
    processedAt: null,
    nextRetry: new Date('2026-06-16T10:01:00.000Z'),
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value?: T) => void;
} {
  let resolveDeferred!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return {
    promise,
    resolve: (value?: T) => resolveDeferred(value as T),
  };
}
