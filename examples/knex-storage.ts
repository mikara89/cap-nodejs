import type { Knex } from 'knex';
import {
  CapEngine,
  createInMemoryPublisher,
  createInMemorySubscriber,
} from '@mikara89/cap-core';
import {
  createKnexCapSchema,
  KnexPublishStorage,
  KnexReceivedStorage,
  KnexTransactionManager,
} from '@mikara89/cap-storage-knex';

export async function createKnexCapEngine(knex: Knex): Promise<CapEngine> {
  await createKnexCapSchema(knex);

  return new CapEngine({
    publishStorage: new KnexPublishStorage(knex),
    receivedStorage: new KnexReceivedStorage(knex),
    transactionManager: new KnexTransactionManager(knex),
    publisher: createInMemoryPublisher(),
    subscriber: createInMemorySubscriber(),
  });
}

export async function publishInsideKnexTransaction(
  engine: CapEngine,
  knex: Knex,
): Promise<void> {
  await knex.transaction(async (tx) => {
    await engine.publish('example.knex', { id: '1' }, { tx });
  });
}
