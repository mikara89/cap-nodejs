import type { DataSource } from 'typeorm';
import {
  CapEngine,
  createInMemoryPublisher,
  createInMemorySubscriber,
} from '@mikara89/cap-core';
import {
  createTypeOrmCapSchema,
  TypeOrmPublishStorage,
  TypeOrmReceivedStorage,
  TypeOrmTransactionManager,
} from '@mikara89/cap-storage-typeorm';

export async function createTypeOrmCapEngine(
  dataSource: DataSource,
): Promise<CapEngine> {
  await createTypeOrmCapSchema(dataSource);

  return new CapEngine({
    publishStorage: new TypeOrmPublishStorage(dataSource),
    receivedStorage: new TypeOrmReceivedStorage(dataSource),
    transactionManager: new TypeOrmTransactionManager(dataSource),
    publisher: createInMemoryPublisher(),
    subscriber: createInMemorySubscriber(),
  });
}

export async function publishInsideTypeOrmTransaction(
  engine: CapEngine,
  dataSource: DataSource,
): Promise<void> {
  await dataSource.transaction(async (manager) => {
    await engine.publish('example.typeorm', { id: '1' }, { tx: manager });
  });
}
