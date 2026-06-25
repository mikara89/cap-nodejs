import { MikroORM, type EntityManager } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import type { CapTransactionManagerPort } from '@mikara89/cap-core';
import { definePublishStorageContract } from '@mikara89/cap-testing';
import { CapPublishEntity } from '../entities/cap-publish.entity';
import { MikroPublishStorage } from './mikro-publish-storage';

definePublishStorageContract<EntityManager>(
  'MikroORM publish storage',
  async () => {
    const orm = await MikroORM.init({
      driver: BetterSqliteDriver,
      dbName: ':memory:',
      entities: [CapPublishEntity],
    });
    await orm.getSchemaGenerator().createSchema();

    const storage = new MikroPublishStorage(orm.em.fork(), orm);
    const transaction: CapTransactionManagerPort<EntityManager> = {
      runInTransaction: async (_options, fn) =>
        orm.em.transactional(async (tx) => fn({ tx })),
    };

    return {
      storage,
      transaction,
      cleanup: async () => {
        await orm.close(true);
      },
    };
  },
  {
    supportsTransactions: true,
    supportsRollback: true,
    supportsSafeConcurrentClaiming: false,
  },
);
