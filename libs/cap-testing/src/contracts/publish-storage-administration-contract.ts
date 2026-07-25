import type {
  CapOutboxSnapshot,
  PublishStorageAdministrationPort,
} from '@mikara89/cap-core';
import { createPublishFixture } from '../fixtures';

export interface PublishStorageAdministrationContractSetup {
  storage: PublishStorageAdministrationPort;
  cleanup: () => Promise<void>;
}

export function definePublishStorageAdministrationContract(
  name: string,
  setup: () => Promise<PublishStorageAdministrationContractSetup>,
): void {
  describe(`${name} publish storage administration contract`, () => {
    it.each(['failed', 'dead_letter'] as const)(
      'requeues eligible %s rows through normal claiming',
      async (status) => {
        await withSetup(setup, async ({ storage }) => {
          const now = new Date('2026-06-16T01:00:00.000Z');
          const event = createPublishFixture({
            id: `publish-requeue-${status}`,
            status,
            retryCount: 3,
            lastError: 'broker failure',
            nextRetryAt: null,
            lockedBy: 'old-worker',
            lockedUntil: new Date('2026-06-16T02:00:00.000Z'),
            publishedAt: new Date('2026-06-16T00:30:00.000Z'),
            payload: { immutable: true },
            headers: { trace: 'immutable' },
          });
          await storage.savePublish(event);

          await expect(
            storage.requeuePublish(event.id, now),
          ).resolves.toMatchObject({
            id: event.id,
            outcome: 'requeued',
          });
          const requeued = await storage.findPublishById?.(event.id);
          expect(requeued).toMatchObject({
            id: event.id,
            topic: event.topic,
            payload: event.payload,
            headers: event.headers,
            occurredAt: event.occurredAt,
            status: 'failed',
            retryCount: 0,
            lastError: null,
            nextRetryAt: now,
            lockedBy: null,
            lockedUntil: null,
            publishedAt: null,
          });
          const claimed = await storage.claimUnpublished({
            limit: 10,
            now,
            lockedBy: 'contract-worker',
            lockUntil: new Date('2026-06-16T01:01:00.000Z'),
          });
          expect(claimed).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: event.id,
                lockedBy: 'contract-worker',
              }),
            ]),
          );
        });
      },
    );

    it('does not requeue missing, pending, processing, or published rows', async () => {
      await withSetup(setup, async ({ storage }) => {
        const statuses = ['pending', 'processing', 'published'] as const;
        for (const status of statuses) {
          const event = createPublishFixture({
            id: `publish-ineligible-${status}`,
            status,
          });
          await storage.savePublish(event);
          await expect(storage.requeuePublish(event.id)).resolves.toEqual({
            id: event.id,
            outcome: 'not_eligible',
            previousStatus: status,
          });
        }
        await expect(
          storage.requeuePublish('missing-publish'),
        ).resolves.toEqual({
          id: 'missing-publish',
          outcome: 'not_found',
        });
      });
    });

    it('returns complete count and age snapshot from durable status aggregates', async () => {
      await withSetup(setup, async ({ storage }) => {
        const records = [
          createPublishFixture({
            id: 'outbox-pending-old',
            status: 'pending',
            occurredAt: '2026-06-16T00:01:00.000Z',
          }),
          createPublishFixture({
            id: 'outbox-pending-new',
            status: 'pending',
            occurredAt: '2026-06-16T00:03:00.000Z',
          }),
          createPublishFixture({
            id: 'outbox-processing',
            status: 'processing',
            occurredAt: '2026-06-16T00:00:00.000Z',
          }),
          createPublishFixture({
            id: 'outbox-published',
            status: 'published',
            occurredAt: '2026-06-16T00:00:00.000Z',
          }),
          createPublishFixture({
            id: 'outbox-failed-old',
            status: 'failed',
            occurredAt: '2026-06-16T00:02:00.000Z',
          }),
          createPublishFixture({
            id: 'outbox-failed-new',
            status: 'failed',
            occurredAt: '2026-06-16T00:04:00.000Z',
          }),
          createPublishFixture({
            id: 'outbox-dead',
            status: 'dead_letter',
            occurredAt: '2026-06-16T00:00:00.000Z',
          }),
        ];
        for (const record of records) await storage.savePublish(record);
        await expect(storage.getPublishSnapshot()).resolves.toMatchObject({
          counts: {
            pending: 2,
            processing: 1,
            published: 1,
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
        const snapshot: CapOutboxSnapshot = await storage.getPublishSnapshot();
        expect(snapshot).toEqual({
          counts: {
            pending: 0,
            processing: 0,
            published: 0,
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
  setup: () => Promise<PublishStorageAdministrationContractSetup>,
  run: (value: PublishStorageAdministrationContractSetup) => Promise<void>,
): Promise<void> {
  const value = await setup();
  try {
    await run(value);
  } finally {
    await value.cleanup();
  }
}
