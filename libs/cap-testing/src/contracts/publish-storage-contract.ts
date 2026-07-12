import {
  isLegacyTransactionalPublishStorage,
  type CapOperationContext,
  type CapPublishEvent,
  type CapTransactionManagerPort,
  type ClaimUnpublishedOptions,
  type JsonValue,
  type PublishStoragePort,
} from '@mikara89/cap-core';
import { createPublishFixture } from '../fixtures';

export interface PublishStorageContractSetup<TTx = unknown> {
  storage: PublishStoragePort<TTx>;
  transaction?: CapTransactionManagerPort<TTx>;
  cleanup: () => Promise<void>;
}

export interface PublishStorageContractOptions {
  supportsTransactions?: boolean;
  supportsRollback?: boolean;
  supportsSafeConcurrentClaiming?: boolean;
  supportsClaimOwnershipFencing?: boolean;
  supportsClaimLeaseRenewal?: boolean;
}

export function definePublishStorageContract<TTx = unknown>(
  name: string,
  setup: () => Promise<PublishStorageContractSetup<TTx>>,
  options: PublishStorageContractOptions = {},
): void {
  describe(`${name} publish storage contract`, () => {
    it('saves publish row without transaction', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('save-without-transaction');

        await storage.savePublish(event);

        await expectPublishedEvent(storage, event.id, {
          id: event.id,
          topic: event.topic,
          status: 'pending',
          retryCount: 0,
        });
      });
    });

    it('saves publish row with operation context', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('save-with-operation-context');
        const ctx: CapOperationContext<TTx> = {
          metadata: { contract: 'publish-storage' },
        };

        await storage.savePublish(event, ctx);

        await expectPublishedEvent(storage, event.id, {
          id: event.id,
          topic: event.topic,
          status: 'pending',
        });
      });
    });

    const transactionIt = options.supportsTransactions ? it : it.skip;
    transactionIt(
      'saves publish row inside transaction when supportsTransactions is true and a transaction manager is provided',
      async () => {
        await withSetup(setup, async ({ storage, transaction }) => {
          const transactionManager = requireTransaction(transaction);
          const event = publishEvent('save-inside-transaction');

          await transactionManager.runInTransaction({}, async (ctx) => {
            await storage.savePublish(event, ctx);
          });

          await expectPublishedEvent(storage, event.id, {
            id: event.id,
            status: 'pending',
          });
        });
      },
    );

    const rollbackIt = options.supportsRollback ? it : it.skip;
    rollbackIt(
      'rolls back publish row when supportsRollback is true and the transaction rolls back',
      async () => {
        await withSetup(setup, async ({ storage, transaction }) => {
          const transactionManager = requireTransaction(transaction);
          const event = publishEvent('rollback-transaction');
          const rollbackError = new Error('contract rollback');

          await expect(
            transactionManager.runInTransaction({}, async (ctx) => {
              await storage.savePublish(event, ctx);
              throw rollbackError;
            }),
          ).rejects.toThrow('contract rollback');

          await expect(findPublish(storage, event.id)).resolves.toBeUndefined();
        });
      },
    );

    it('supports deprecated savePublishWithTx when implemented', async () => {
      await withSetup(setup, async ({ storage, transaction }) => {
        if (!isLegacyTransactionalPublishStorage(storage)) {
          expect(isLegacyTransactionalPublishStorage(storage)).toBe(false);
          return;
        }

        const transactionManager = requireTransaction(transaction);
        const event = publishEvent('deprecated-save-publish-with-tx');

        await transactionManager.runInTransaction({}, async (ctx) => {
          if (ctx.tx === undefined) {
            throw new Error(
              'Legacy savePublishWithTx contract requires transaction ctx.tx',
            );
          }
          await storage.savePublishWithTx(event, ctx.tx);
        });

        await expectPublishedEvent(storage, event.id, {
          id: event.id,
          status: 'pending',
        });
      });
    });

    it('releases expired claims', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('release-expired-claims', {
          status: 'processing',
          lockedBy: 'contract-worker',
          lockedUntil: new Date('2026-06-16T00:00:00.000Z'),
        });

        await storage.savePublish(event);
        await storage.releaseExpiredClaims(
          new Date('2026-06-16T00:01:00.000Z'),
        );

        await expectPublishedEvent(storage, event.id, {
          status: 'failed',
          lockedBy: null,
          lockedUntil: null,
        });
      });
    });

    it('marks published correctly', async () => {
      await withSetup(setup, async ({ storage }) => {
        const publishedAt = new Date('2026-06-16T00:02:00.000Z');
        const event = publishEvent('mark-published', {
          status: 'processing',
          lockedBy: 'contract-worker',
          lockedUntil: new Date('2026-06-16T00:03:00.000Z'),
        });

        await storage.savePublish(event);
        await storage.markPublished(event.id, publishedAt);

        await expectPublishedEvent(storage, event.id, {
          status: 'published',
          publishedAt,
          lockedBy: null,
          lockedUntil: null,
        });
      });
    });

    it('marks failed correctly', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('mark-failed', {
          status: 'processing',
          lockedBy: 'contract-worker',
          lockedUntil: new Date('2026-06-16T00:03:00.000Z'),
        });
        const nextRetryAt = new Date('2026-06-16T00:04:00.000Z');

        await storage.savePublish(event);
        await storage.markPublishFailed(event.id, new Error('network'), {
          maxRetries: 3,
          nextRetryAt,
          now: new Date('2026-06-16T00:03:30.000Z'),
        });

        await expectPublishedEvent(storage, event.id, {
          status: 'failed',
          retryCount: 1,
          nextRetryAt,
          lastError: 'network',
          lockedBy: null,
          lockedUntil: null,
        });
      });
    });

    it('keeps the penultimate retry failed with its retry schedule', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('mark-penultimate-failure', {
          status: 'processing',
          retryCount: 1,
          lockedBy: 'contract-worker',
          lockedUntil: new Date('2026-06-16T00:03:00.000Z'),
        });
        const nextRetryAt = new Date('2026-06-16T00:04:00.000Z');

        await storage.savePublish(event);
        await storage.markPublishFailed(event.id, 'second failure', {
          maxRetries: 3,
          nextRetryAt,
          now: new Date('2026-06-16T00:03:30.000Z'),
        });

        await expectPublishedEvent(storage, event.id, {
          status: 'failed',
          retryCount: 2,
          nextRetryAt,
          lastError: 'second failure',
          lockedBy: null,
          lockedUntil: null,
        });
      });
    });

    it('increments retry and dead-letters according to MarkPublishFailedOptions', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('mark-dead-letter', {
          status: 'processing',
          retryCount: 2,
          lockedBy: 'contract-worker',
          lockedUntil: new Date('2026-06-16T00:03:00.000Z'),
        });

        await storage.savePublish(event);
        await storage.markPublishFailed(event.id, 'permanent failure', {
          maxRetries: 3,
          nextRetryAt: new Date('2026-06-16T00:04:00.000Z'),
          now: new Date('2026-06-16T00:03:30.000Z'),
        });

        await expectPublishedEvent(storage, event.id, {
          status: 'dead_letter',
          retryCount: 3,
          nextRetryAt: null,
          lastError: 'permanent failure',
          lockedBy: null,
          lockedUntil: null,
        });
      });
    });

    it('claimUnpublished does not claim already published rows', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('claim-skips-published', {
          status: 'published',
          publishedAt: new Date('2026-06-16T00:02:00.000Z'),
        });

        await storage.savePublish(event);
        const claimed = await storage.claimUnpublished(claimOptions(10));

        expect(claimed.map((item) => item.id)).not.toContain(event.id);
      });
    });

    it('claimUnpublished respects limit', async () => {
      await withSetup(setup, async ({ storage }) => {
        const events = [
          publishEvent('claim-limit-1'),
          publishEvent('claim-limit-2'),
          publishEvent('claim-limit-3'),
        ];

        for (const event of events) {
          await storage.savePublish(event);
        }

        const claimed = await storage.claimUnpublished(claimOptions(2));

        expect(claimed).toHaveLength(2);
      });
    });

    const ownershipIt = options.supportsClaimOwnershipFencing ? it : it.skip;
    const renewalIt = options.supportsClaimLeaseRenewal ? it : it.skip;

    ownershipIt('claimed event exposes its opaque claim owner', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('claim-owner');
        await storage.savePublish(event);

        const [claimed] = await storage.claimUnpublished(
          claimOptions(1, 'contract-worker:claim-1'),
        );

        expect(claimed).toMatchObject({
          id: event.id,
          status: 'processing',
          lockedBy: 'contract-worker:claim-1',
        });
      });
    });

    renewalIt(
      'matching owner renews and stale owner cannot renew',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const event = publishEvent('renew-owner');
          await storage.savePublish(event);
          await storage.claimUnpublished(
            claimOptions(1, 'contract-worker:claim-1'),
          );
          const now = new Date('2026-06-16T00:05:30.000Z');
          const lockUntil = new Date('2026-06-16T00:07:00.000Z');

          await expect(
            storage.renewPublishClaim?.({
              id: event.id,
              expectedLockedBy: 'contract-worker:claim-1',
              now,
              lockUntil,
            }),
          ).resolves.toBe(true);
          await expect(
            storage.renewPublishClaim?.({
              id: event.id,
              expectedLockedBy: 'contract-worker:stale',
              now,
              lockUntil: new Date('2026-06-16T00:08:00.000Z'),
            }),
          ).resolves.toBe(false);
          await expectPublishedEvent(storage, event.id, {
            lockedBy: 'contract-worker:claim-1',
            lockedUntil: lockUntil,
          });
        });
      },
    );

    ownershipIt(
      'matching owner completes publish and stale owner cannot mutate it',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const event = publishEvent('fenced-published');
          await storage.savePublish(event);
          await storage.claimUnpublished(
            claimOptions(1, 'contract-worker:claim-1'),
          );
          const publishedAt = new Date('2026-06-16T00:05:30.000Z');

          await expect(
            storage.markPublished(event.id, publishedAt, {
              expectedLockedBy: 'contract-worker:stale',
            }),
          ).resolves.toBe(false);
          await expectPublishedEvent(storage, event.id, {
            status: 'processing',
            lockedBy: 'contract-worker:claim-1',
            publishedAt: null,
          });
          await expect(
            storage.markPublished(event.id, publishedAt, {
              expectedLockedBy: 'contract-worker:claim-1',
            }),
          ).resolves.toBe(true);
          await expectPublishedEvent(storage, event.id, {
            status: 'published',
            publishedAt,
            lockedBy: null,
          });
        });
      },
    );

    ownershipIt(
      'matching owner records one failure and stale owner cannot mutate retry state',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const event = publishEvent('fenced-failed');
          await storage.savePublish(event);
          await storage.claimUnpublished(
            claimOptions(1, 'contract-worker:claim-1'),
          );
          const failureOptions = {
            maxRetries: 3,
            nextRetryAt: new Date('2026-06-16T00:07:00.000Z'),
            now: new Date('2026-06-16T00:05:30.000Z'),
          };

          await expect(
            storage.markPublishFailed(event.id, 'stale failure', {
              ...failureOptions,
              expectedLockedBy: 'contract-worker:stale',
            }),
          ).resolves.toBe(false);
          await expectPublishedEvent(storage, event.id, {
            status: 'processing',
            retryCount: 0,
            lastError: null,
            lockedBy: 'contract-worker:claim-1',
          });
          await expect(
            storage.markPublishFailed(event.id, 'owned failure', {
              ...failureOptions,
              expectedLockedBy: 'contract-worker:claim-1',
            }),
          ).resolves.toBe(true);
          await expectPublishedEvent(storage, event.id, {
            status: 'failed',
            retryCount: 1,
            lastError: 'owned failure',
            lockedBy: null,
          });
        });
      },
    );

    ownershipIt(
      'expired claim is reclaimed and the original owner cannot complete it',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const event = publishEvent('reclaimed-owner');
          await storage.savePublish(event);
          await storage.claimUnpublished({
            limit: 1,
            lockedBy: 'contract-worker:claim-1',
            now: new Date('2026-06-16T00:01:00.000Z'),
            lockUntil: new Date('2026-06-16T00:02:00.000Z'),
          });
          const [reclaimed] = await storage.claimUnpublished({
            limit: 1,
            lockedBy: 'contract-worker:claim-2',
            now: new Date('2026-06-16T00:03:00.000Z'),
            lockUntil: new Date('2026-06-16T00:04:00.000Z'),
          });

          expect(reclaimed?.lockedBy).toBe('contract-worker:claim-2');
          await expect(
            storage.markPublished(event.id, new Date(), {
              expectedLockedBy: 'contract-worker:claim-1',
            }),
          ).resolves.toBe(false);
          await expectPublishedEvent(storage, event.id, {
            status: 'processing',
            lockedBy: 'contract-worker:claim-2',
          });
          await expect(
            storage.markPublished(event.id, new Date(), {
              expectedLockedBy: 'contract-worker:claim-2',
            }),
          ).resolves.toBe(true);
        });
      },
    );

    renewalIt('renewed claim is not released at its old expiry', async () => {
      await withSetup(setup, async ({ storage }) => {
        const event = publishEvent('renewed-not-released');
        await storage.savePublish(event);
        await storage.claimUnpublished({
          limit: 1,
          lockedBy: 'contract-worker:claim-1',
          now: new Date('2026-06-16T00:01:00.000Z'),
          lockUntil: new Date('2026-06-16T00:02:00.000Z'),
        });
        await storage.renewPublishClaim?.({
          id: event.id,
          expectedLockedBy: 'contract-worker:claim-1',
          now: new Date('2026-06-16T00:01:30.000Z'),
          lockUntil: new Date('2026-06-16T00:04:00.000Z'),
        });

        await storage.releaseExpiredClaims(
          new Date('2026-06-16T00:02:30.000Z'),
        );

        await expectPublishedEvent(storage, event.id, {
          status: 'processing',
          lockedBy: 'contract-worker:claim-1',
          lockedUntil: new Date('2026-06-16T00:04:00.000Z'),
        });
      });
    });

    it('reported claim capabilities agree with contract options', async () => {
      await withSetup(setup, ({ storage }) => {
        const capabilityStorage = storage as PublishStoragePort<TTx> & {
          getCapabilities?: () => {
            claimOwnershipFencing?: boolean;
            claimLeaseRenewal?: boolean;
          };
        };
        if (!capabilityStorage.getCapabilities) return;
        const capabilities = capabilityStorage.getCapabilities();
        expect(capabilities.claimOwnershipFencing ?? false).toBe(
          options.supportsClaimOwnershipFencing ?? false,
        );
        expect(capabilities.claimLeaseRenewal ?? false).toBe(
          options.supportsClaimLeaseRenewal ?? false,
        );
      });
    });

    const concurrentClaimingIt = options.supportsSafeConcurrentClaiming
      ? it
      : it.skip;
    concurrentClaimingIt(
      'concurrent claiming is safe when supportsSafeConcurrentClaiming is true',
      async () => {
        await withSetup(setup, async ({ storage }) => {
          const events = Array.from({ length: 8 }, (_, index) =>
            publishEvent(`concurrent-claim-${index + 1}`),
          );

          for (const event of events) {
            await storage.savePublish(event);
          }

          const [workerOne, workerTwo] = await Promise.all([
            storage.claimUnpublished(claimOptions(4, 'contract-worker-1')),
            storage.claimUnpublished(claimOptions(4, 'contract-worker-2')),
          ]);
          const claimedIds = [...workerOne, ...workerTwo].map(
            (event) => event.id,
          );

          expect(new Set(claimedIds).size).toBe(claimedIds.length);
          expect(claimedIds.length).toBeLessThanOrEqual(events.length);
        });
      },
    );
  });
}

async function withSetup<TTx>(
  setup: () => Promise<PublishStorageContractSetup<TTx>>,
  test: (setup: PublishStorageContractSetup<TTx>) => Promise<void> | void,
): Promise<void> {
  const env = await setup();
  try {
    await test(env);
  } finally {
    await env.cleanup();
  }
}

function requireTransaction<TTx>(
  transaction: CapTransactionManagerPort<TTx> | undefined,
): CapTransactionManagerPort<TTx> {
  expect(transaction).toBeDefined();
  if (!transaction) {
    throw new Error(
      'Publish storage contract requires a transaction manager for this capability',
    );
  }
  return transaction;
}

function publishEvent(
  id: string,
  overrides: Partial<CapPublishEvent<JsonValue>> = {},
): CapPublishEvent<JsonValue> {
  return {
    ...createPublishFixture({
      id: `contract-${id}`,
      topic: 'contract.topic',
      occurredAt: '2026-06-16T00:00:00.000Z',
      payload: { id },
      headers: { 'x-contract': 'publish-storage' },
    }),
    ...overrides,
  };
}

function claimOptions(
  limit: number,
  lockedBy = 'contract-worker',
): ClaimUnpublishedOptions {
  return {
    limit,
    lockedBy,
    now: new Date('2026-06-16T00:05:00.000Z'),
    lockUntil: new Date('2026-06-16T00:06:00.000Z'),
  };
}

async function expectPublishedEvent<TTx>(
  storage: PublishStoragePort<TTx>,
  id: string,
  expected: Partial<CapPublishEvent<JsonValue>>,
): Promise<void> {
  await expect(findPublish(storage, id)).resolves.toMatchObject(expected);
}

function findPublish<TTx>(
  storage: PublishStoragePort<TTx>,
  id: string,
): Promise<CapPublishEvent<JsonValue> | undefined> {
  if (typeof storage.findPublishById !== 'function') {
    throw new Error(
      'Publish storage contract requires findPublishById for verification',
    );
  }
  return storage.findPublishById(id);
}
