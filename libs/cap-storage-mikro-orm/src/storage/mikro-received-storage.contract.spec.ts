import { MikroORM } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import {
  defineReceivedStorageAdministrationContract,
  defineReceivedStorageContract,
} from '@mikara89/cap-testing';
import { CapReceivedEntity } from '../entities/cap-received.entity';
import { MikroReceivedStorage } from './mikro-received-storage';

defineReceivedStorageContract(
  'MikroORM received storage',
  async () => {
    const orm = await MikroORM.init({
      driver: BetterSqliteDriver,
      dbName: ':memory:',
      entities: [CapReceivedEntity],
    });
    await orm.getSchemaGenerator().createSchema();

    const storage = new MikroReceivedStorage(orm.em.fork(), orm);

    return {
      storage,
      cleanup: async () => {
        await orm.close(true);
      },
    };
  },
  {
    supportsAtomicInsertIgnore: false,
    supportsSafeConcurrentInsert: false,
  },
);

defineReceivedStorageAdministrationContract(
  'MikroORM received storage',
  async () => {
    const orm = await MikroORM.init({
      driver: BetterSqliteDriver,
      dbName: ':memory:',
      entities: [CapReceivedEntity],
    });
    await orm.getSchemaGenerator().createSchema();
    return {
      storage: new MikroReceivedStorage(orm.em.fork(), orm),
      cleanup: async () => orm.close(true),
    };
  },
);
