import knexFactory, { type Knex } from 'knex';
import { createKnexCapSchema } from '../knex-cap-schema';
import { KnexPublishStorage } from '../knex-publish-storage';
import { KnexReceivedStorage } from '../knex-received-storage';
import { KnexTransactionManager } from '../knex-transaction-manager';

export interface KnexTestStorage {
  knex: Knex;
  publishStorage: KnexPublishStorage;
  receivedStorage: KnexReceivedStorage;
  transactionManager: KnexTransactionManager;
  cleanup: () => Promise<void>;
}

export async function createKnexTestStorage(): Promise<KnexTestStorage> {
  const knex = knexFactory({
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  });

  await createKnexCapSchema(knex);

  return {
    knex,
    publishStorage: new KnexPublishStorage(knex),
    receivedStorage: new KnexReceivedStorage(knex),
    transactionManager: new KnexTransactionManager(knex),
    cleanup: () => knex.destroy(),
  };
}
