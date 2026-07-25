import type { Knex } from 'knex';
import {
  definePublishStorageAdministrationContract,
  definePublishStorageContract,
} from '@mikara89/cap-testing';
import { createKnexTestStorage } from './testing/create-knex-test-storage';

definePublishStorageContract<Knex.Transaction>(
  'Knex publish storage',
  async () => {
    const env = await createKnexTestStorage();

    return {
      storage: env.publishStorage,
      transaction: env.transactionManager,
      cleanup: env.cleanup,
    };
  },
  {
    supportsTransactions: true,
    supportsRollback: true,
    supportsSafeConcurrentClaiming: false,
    supportsClaimOwnershipFencing: true,
    supportsClaimLeaseRenewal: true,
  },
);

definePublishStorageAdministrationContract('Knex publish storage', async () => {
  const env = await createKnexTestStorage();
  return { storage: env.publishStorage, cleanup: env.cleanup };
});
