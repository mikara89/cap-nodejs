import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { createTypeOrmCapSchema } from '../typeorm-cap-schema';
import { TypeOrmPublishStorage } from '../typeorm-publish-storage';
import { TypeOrmReceivedStorage } from '../typeorm-received-storage';
import { TypeOrmTransactionManager } from '../typeorm-transaction-manager';

export interface TypeOrmTestStorage {
  dataSource: DataSource;
  publishStorage: TypeOrmPublishStorage;
  receivedStorage: TypeOrmReceivedStorage;
  transactionManager: TypeOrmTransactionManager;
  cleanup: () => Promise<void>;
}

export async function createTypeOrmTestStorage(): Promise<TypeOrmTestStorage> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [],
    synchronize: false,
  });

  await dataSource.initialize();
  await createTypeOrmCapSchema(dataSource);

  return {
    dataSource,
    publishStorage: new TypeOrmPublishStorage(dataSource),
    receivedStorage: new TypeOrmReceivedStorage(dataSource),
    transactionManager: new TypeOrmTransactionManager(dataSource),
    cleanup: () => dataSource.destroy(),
  };
}
