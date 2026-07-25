import type {
  CapInboxSnapshot,
  ReceivedStorageAdministrationPort,
} from '@mikara89/cap-core';
import { createReceivedFixture } from '../fixtures';

export interface ReceivedStorageAdministrationContractSetup {
  storage: ReceivedStorageAdministrationPort;
  cleanup: () => Promise<void>;
}

export function defineReceivedStorageAdministrationContract(
  name: string,
  setup: () => Promise<ReceivedStorageAdministrationContractSetup>,
): void {
  describe(`${name} received storage administration contract`, () => {
    it.each(['failed', 'dead_letter'] as const)(
      'requeues eligible %s rows into normal retry processing',
      async (status) => {
        await withSetup(setup, async ({ storage }) => {
          const now = new Date('2026-06-16T01:00:00.000Z');
          const event = createReceivedFixture({
            id: `received-requeue-${status}`,
            status,
            retryCount: 3,
            lastError: 'failed handler',
            nextRetry: null,
            processed: true,
            processedAt: new Date('2026-06-16T00:30:00.000Z'),
            payload: { immutable: true },
            headers: { trace: 'immutable' },
          });
          await storage.trySaveReceived(event);

          await expect(
            storage.requeueReceived(event.id, now),
          ).resolves.toMatchObject({
            id: event.id,
            outcome: 'requeued',
          });
          const requeued = await storage.findReceivedById?.(event.id);
          expect(requeued).toMatchObject({
            id: event.id,
            topic: event.topic,
            group: event.group,
            messageId: event.messageId,
            dedupeKey: event.dedupeKey,
            payload: event.payload,
            headers: event.headers,
            occurredAt: event.occurredAt,
            status: 'failed',
            retryCount: 0,
            lastError: null,
            nextRetry: now,
            processed: false,
            processedAt: null,
          });
          await expect(storage.getRetryDue(10, now)).resolves.toEqual(
            expect.arrayContaining([expect.objectContaining({ id: event.id })]),
          );
        });
      },
    );

    it('does not requeue missing, pending, processing, or processed rows', async () => {
      await withSetup(setup, async ({ storage }) => {
        const statuses = ['pending', 'processing', 'processed'] as const;
        for (const status of statuses) {
          const event = createReceivedFixture({
            id: `received-ineligible-${status}`,
            messageId: `message-ineligible-${status}`,
            status,
            processed: status === 'processed',
          });
          await storage.trySaveReceived(event);
          await expect(storage.requeueReceived(event.id)).resolves.toEqual({
            id: event.id,
            outcome: 'not_eligible',
            previousStatus: status,
          });
        }
        await expect(
          storage.requeueReceived('missing-received'),
        ).resolves.toEqual({
          id: 'missing-received',
          outcome: 'not_found',
        });
      });
    });

    it('returns complete count and age snapshot from durable status aggregates', async () => {
      await withSetup(setup, async ({ storage }) => {
        const records = [
          createReceivedFixture({
            id: 'inbox-pending-old',
            messageId: 'p1',
            status: 'pending',
            occurredAt: '2026-06-16T00:01:00.000Z',
          }),
          createReceivedFixture({
            id: 'inbox-pending-new',
            messageId: 'p2',
            status: 'pending',
            occurredAt: '2026-06-16T00:03:00.000Z',
          }),
          createReceivedFixture({
            id: 'inbox-processing',
            messageId: 'p3',
            status: 'processing',
            occurredAt: '2026-06-16T00:00:00.000Z',
          }),
          createReceivedFixture({
            id: 'inbox-processed',
            messageId: 'p4',
            status: 'processed',
            processed: true,
            occurredAt: '2026-06-16T00:00:00.000Z',
          }),
          createReceivedFixture({
            id: 'inbox-failed-old',
            messageId: 'p5',
            status: 'failed',
            occurredAt: '2026-06-16T00:02:00.000Z',
          }),
          createReceivedFixture({
            id: 'inbox-failed-new',
            messageId: 'p6',
            status: 'failed',
            occurredAt: '2026-06-16T00:04:00.000Z',
          }),
          createReceivedFixture({
            id: 'inbox-dead',
            messageId: 'p7',
            status: 'dead_letter',
            occurredAt: '2026-06-16T00:00:00.000Z',
          }),
        ];
        for (const record of records) await storage.trySaveReceived(record);

        await expect(storage.getReceivedSnapshot()).resolves.toMatchObject({
          counts: {
            pending: 2,
            processing: 1,
            processed: 1,
            failed: 2,
            dead_letter: 1,
          },
          oldestPendingAt: new Date('2026-06-16T00:01:00.000Z'),
          oldestFailedAt: new Date('2026-06-16T00:02:00.000Z'),
        });
      });
    });

    it('returns null ages when pending and failed groups are absent', async () => {
      await withSetup(setup, async ({ storage }) => {
        const snapshot: CapInboxSnapshot = await storage.getReceivedSnapshot();
        expect(snapshot).toEqual({
          counts: {
            pending: 0,
            processing: 0,
            processed: 0,
            failed: 0,
            dead_letter: 0,
          },
          oldestPendingAt: null,
          oldestFailedAt: null,
        });
      });
    });
  });
}

async function withSetup(
  setup: () => Promise<ReceivedStorageAdministrationContractSetup>,
  run: (value: ReceivedStorageAdministrationContractSetup) => Promise<void>,
): Promise<void> {
  const value = await setup();
  try {
    await run(value);
  } finally {
    await value.cleanup();
  }
}
