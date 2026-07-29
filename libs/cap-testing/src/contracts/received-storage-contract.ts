import {
  type CapReceivedEvent,
  type JsonValue,
  type ReceivedStoragePort,
} from '@mikara89/cap-core';
import { createReceivedFixture } from '../fixtures';

export interface ReceivedStorageContractSetup {
  storage: ReceivedStoragePort;
  cleanup: () => Promise<void>;
}

export interface ReceivedStorageContractOptions {
  supportsAtomicInsertIgnore?: boolean;
  supportsSafeConcurrentInsert?: boolean;
}

export function defineReceivedStorageContract(
  name: string,
  setup: () => Promise<ReceivedStorageContractSetup>,
  options: ReceivedStorageContractOptions = {},
): void {
  describe(`${name} received storage contract`, () => {
    it('inserts received inbox record', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = receivedEvent('insert-record');

        const result = await storage.trySaveReceived(event);

        expect(result).toMatchObject({
          inserted: true,
          id: event.id,
        });
        await expectReceivedEvent(storage, event.id, {
          id: event.id,
          topic: event.topic,
          group: event.group,
          dedupeKey: event.dedupeKey,
          status: 'pending',
          processed: false,
          retryCount: 0,
        });
      });
    });

    it('detects duplicate by group and dedupeKey', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = receivedEvent('dedupe-original');
        const duplicate = receivedEvent('dedupe-duplicate', {
          id: 'contract-dedupe-duplicate',
          messageId: 'message-dedupe-duplicate',
          group: event.group,
          dedupeKey: event.dedupeKey,
        });

        const first = await storage.trySaveReceived(event);
        const second = await storage.trySaveReceived(duplicate);

        expect(first.inserted).toBe(true);
        expect(second.inserted).toBe(false);
        expect(second.id).toBe(event.id);
        expect(second.event).toMatchObject({
          id: event.id,
          group: event.group,
          dedupeKey: event.dedupeKey,
        });
      });
    });

    it('allows same dedupeKey in different groups', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = receivedEvent('shared-dedupe-group-a', {
          group: 'contract-group-a',
          dedupeKey: 'shared-dedupe-key',
        });
        const otherGroup = receivedEvent('shared-dedupe-group-b', {
          id: 'contract-shared-dedupe-group-b',
          group: 'contract-group-b',
          dedupeKey: event.dedupeKey,
        });

        const first = await storage.trySaveReceived(event);
        const second = await storage.trySaveReceived(otherGroup);

        expect(first.inserted).toBe(true);
        expect(second.inserted).toBe(true);
        await expectReceivedEvent(storage, event.id, { group: event.group });
        await expectReceivedEvent(storage, otherGroup.id, {
          group: otherGroup.group,
        });
      });
    });

    it('marks processed correctly', async () => {
      await withSetup(setup, async ({ storage }) => {
        const processedAt = new Date('2026-06-16T00:02:00.000Z');
        const event = receivedEvent('mark-processed', {
          status: 'failed',
          processed: false,
          nextRetry: new Date('2026-06-16T00:03:00.000Z'),
        });

        await storage.trySaveReceived(event);
        await storage.markProcessed(event.id, processedAt);

        await expectReceivedEvent(storage, event.id, {
          status: 'processed',
          processed: true,
          processedAt,
          nextRetry: null,
        });
      });
    });

    it('marks failed correctly', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = receivedEvent('mark-failed');
        const nextRetry = new Date('2026-06-16T00:04:00.000Z');

        await storage.trySaveReceived(event);
        await storage.markReceivedFailed(event.id, new Error('handler'), {
          maxRetries: 3,
          nextRetryAt: nextRetry,
          now: new Date('2026-06-16T00:03:30.000Z'),
        });

        await expectReceivedEvent(storage, event.id, {
          status: 'failed',
          processed: false,
          retryCount: 1,
          nextRetry,
          lastError: 'handler',
        });
      });
    });

    it('increments retry and dead-letters according to MarkReceivedFailedOptions', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = receivedEvent('mark-dead-letter', {
          retryCount: 2,
          status: 'failed',
        });

        await storage.trySaveReceived(event);
        await storage.markReceivedFailed(event.id, 'permanent failure', {
          maxRetries: 3,
          nextRetryAt: new Date('2026-06-16T00:04:00.000Z'),
          now: new Date('2026-06-16T00:03:30.000Z'),
        });

        await expectReceivedEvent(storage, event.id, {
          status: 'dead_letter',
          processed: false,
          retryCount: 3,
          nextRetry: null,
          lastError: 'permanent failure',
        });
      });
    });

    it('getRetryDue returns due failed records and respects limit', async () => {
      await withSetup(setup, async ({ storage }) => {
        const dueOne = receivedEvent('retry-due-1', {
          status: 'failed',
          retryCount: 1,
          nextRetry: new Date('2026-06-16T00:01:00.000Z'),
        });
        const dueTwo = receivedEvent('retry-due-2', {
          status: 'failed',
          retryCount: 1,
          nextRetry: new Date('2026-06-16T00:02:00.000Z'),
        });
        const future = receivedEvent('retry-future', {
          status: 'failed',
          retryCount: 1,
          nextRetry: new Date('2026-06-16T00:10:00.000Z'),
        });
        const pending = receivedEvent('retry-pending', {
          status: 'pending',
          nextRetry: new Date('2026-06-16T00:01:00.000Z'),
        });
        const processed = receivedEvent('retry-processed', {
          status: 'processed',
          processed: true,
          processedAt: new Date('2026-06-16T00:00:30.000Z'),
          nextRetry: new Date('2026-06-16T00:01:00.000Z'),
        });
        const deadLetter = receivedEvent('retry-dead-letter', {
          status: 'dead_letter',
          retryCount: 3,
          nextRetry: new Date('2026-06-16T00:01:00.000Z'),
        });

        for (const event of [
          dueOne,
          dueTwo,
          future,
          pending,
          processed,
          deadLetter,
        ]) {
          await storage.trySaveReceived(event);
        }

        const retryDue = await storage.getRetryDue(
          2,
          new Date('2026-06-16T00:02:30.000Z'),
        );
        const retryDueIds = retryDue.map((event) => event.id);

        expect(retryDueIds).toHaveLength(2);
        expect(retryDueIds).toContain(dueOne.id);
        expect(retryDueIds).toContain(dueTwo.id);
        expect(retryDueIds).not.toContain(future.id);
        expect(retryDueIds).not.toContain(pending.id);
        expect(retryDueIds).not.toContain(processed.id);
        expect(retryDueIds).not.toContain(deadLetter.id);
      });
    });

    it('recovers due failed and stale pending records as one deterministic batch', async () => {
      await withSetup(setup, async ({ storage }) => {
        const now = new Date('2026-06-16T00:10:00.000Z');
        const pendingBefore = new Date('2026-06-16T00:06:00.000Z');
        const dueFailed = receivedEvent('combined-due-failed', {
          status: 'failed',
          retryCount: 1,
          nextRetry: new Date('2026-06-16T00:05:00.000Z'),
        });
        const stalePending = receivedEvent('combined-stale-pending', {
          occurredAt: '2026-06-16T00:05:59.000Z',
        });
        const boundaryPending = receivedEvent('combined-boundary-pending', {
          occurredAt: '2026-06-16T00:06:00.000Z',
        });
        const anotherStalePending = receivedEvent('combined-another-pending', {
          occurredAt: '2026-06-16T00:01:00.000Z',
        });
        const recentPending = receivedEvent('combined-recent-pending', {
          occurredAt: '2026-06-16T00:06:01.000Z',
        });
        const futureFailed = receivedEvent('combined-future-failed', {
          status: 'failed',
          retryCount: 1,
          nextRetry: new Date('2026-06-16T00:10:01.000Z'),
        });
        const processed = receivedEvent('combined-processed', {
          status: 'processed',
          processed: true,
          processedAt: new Date('2026-06-16T00:05:00.000Z'),
        });
        const deadLetter = receivedEvent('combined-dead-letter', {
          status: 'dead_letter',
          retryCount: 3,
        });

        for (const event of [
          dueFailed,
          stalePending,
          boundaryPending,
          anotherStalePending,
          recentPending,
          futureFailed,
          processed,
          deadLetter,
        ]) {
          await storage.trySaveReceived(event);
        }

        const full = await storage.getRetryDue(10, now, pendingBefore);
        const limited = await storage.getRetryDue(2, now, pendingBefore);
        const limitedAgain = await storage.getRetryDue(2, now, pendingBefore);

        expect(full.map((event) => event.id)).toEqual([
          anotherStalePending.id,
          dueFailed.id,
          stalePending.id,
          boundaryPending.id,
        ]);
        expect(full.map((event) => event.id)).toContain(boundaryPending.id);
        expect(full.map((event) => event.id)).not.toEqual(
          expect.arrayContaining([
            recentPending.id,
            futureFailed.id,
            processed.id,
            deadLetter.id,
          ]),
        );
        expect(new Set(full.map((event) => event.id)).size).toBe(full.length);
        expect(limited.map((event) => event.id)).toEqual([
          anotherStalePending.id,
          dueFailed.id,
        ]);
        expect(limitedAgain.map((event) => event.id)).toEqual(
          limited.map((event) => event.id),
        );
      });
    });

    it('preserves legacy due-failed-only behavior without a pending cutoff', async () => {
      await withSetup(setup, async ({ storage }) => {
        const due = receivedEvent('legacy-due', {
          status: 'failed',
          retryCount: 1,
          nextRetry: new Date('2026-06-16T00:05:00.000Z'),
        });
        const stalePending = receivedEvent('legacy-stale-pending', {
          occurredAt: '2026-06-16T00:00:00.000Z',
        });
        await storage.trySaveReceived(due);
        await storage.trySaveReceived(stalePending);

        const result = await storage.getRetryDue(
          10,
          new Date('2026-06-16T00:10:00.000Z'),
        );

        expect(result.map((event) => event.id)).toEqual([due.id]);
      });
    });

    const atomicInsertIgnoreIt = options.supportsAtomicInsertIgnore
      ? it
      : it.skip;
    atomicInsertIgnoreIt(
      'atomic insert-ignore handles concurrent duplicate deliveries when supported',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const first = receivedEvent('atomic-insert-ignore');
          const duplicate = receivedEvent('atomic-insert-ignore-duplicate', {
            id: 'contract-atomic-insert-ignore-duplicate',
            group: first.group,
            dedupeKey: first.dedupeKey,
          });

          const results = await Promise.all([
            storage.trySaveReceived(first),
            storage.trySaveReceived(duplicate),
          ]);

          expect(results.filter((result) => result.inserted)).toHaveLength(1);
          const inserted = results.find((result) => result.inserted);
          if (!inserted) {
            throw new Error('Expected one concurrent insert to win');
          }
          expect(new Set(results.map((result) => result.id))).toEqual(
            new Set([inserted.id]),
          );
        });
      },
    );

    const concurrentInsertIt = options.supportsSafeConcurrentInsert
      ? it
      : it.skip;
    concurrentInsertIt(
      'concurrent duplicate inserts are safe when supportsSafeConcurrentInsert is true',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const events = Array.from({ length: 8 }, (_, index) =>
            receivedEvent(`concurrent-insert-${index + 1}`, {
              id: `contract-concurrent-insert-${index + 1}`,
              messageId: `message-concurrent-insert-${index + 1}`,
              dedupeKey: 'contract-concurrent-insert',
            }),
          );

          const results = await Promise.all(
            events.map((event) => storage.trySaveReceived(event)),
          );

          expect(results.filter((result) => result.inserted)).toHaveLength(1);
          expect(new Set(results.map((result) => result.id)).size).toBe(1);
        });
      },
    );
  });
}

async function withSetup(
  setup: () => Promise<ReceivedStorageContractSetup>,
  test: (setup: ReceivedStorageContractSetup) => Promise<void>,
): Promise<void> {
  const env = await setup();
  try {
    await test(env);
  } finally {
    await env.cleanup();
  }
}

function receivedEvent(
  id: string,
  overrides: Partial<CapReceivedEvent<JsonValue>> = {},
): CapReceivedEvent<JsonValue> {
  return {
    ...createReceivedFixture({
      id: `contract-${id}`,
      topic: 'contract.topic',
      group: 'contract-group',
      messageId: `message-${id}`,
      occurredAt: '2026-06-16T00:00:00.000Z',
      payload: { id },
      headers: { 'x-contract': 'received-storage' },
    }),
    ...overrides,
  };
}

async function expectReceivedEvent(
  storage: ReceivedStoragePort,
  id: string,
  expected: Partial<CapReceivedEvent<JsonValue>>,
): Promise<void> {
  await expect(findReceived(storage, id)).resolves.toMatchObject(expected);
}

function findReceived(
  storage: ReceivedStoragePort,
  id: string,
): Promise<CapReceivedEvent<JsonValue> | undefined> {
  if (typeof storage.findReceivedById !== 'function') {
    throw new Error(
      'Received storage contract requires findReceivedById for verification',
    );
  }
  return storage.findReceivedById(id);
}
