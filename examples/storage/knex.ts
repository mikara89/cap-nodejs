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

export async function publishWithKnexTransaction(
  engine: CapEngine,
  knex: Knex,
): Promise<void> {
  await knex.transaction(async (tx) => {
    await engine.publish('example.knex.tx', { id: '1' }, { tx });
  });
}

export async function publishWithKnexContext(
  engine: CapEngine,
  knex: Knex,
): Promise<void> {
  await knex.transaction(async (tx) => {
    await engine.publish('example.knex.ctx', { id: '2' }, { ctx: { tx } });
  });
}
