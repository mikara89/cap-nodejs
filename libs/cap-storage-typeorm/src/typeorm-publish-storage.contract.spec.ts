import type { EntityManager } from 'typeorm';
import {
  definePublishStorageAdministrationContract,
  definePublishStorageContract,
} from '@mikara89/cap-testing';
import { createTypeOrmTestStorage } from './testing/create-typeorm-test-storage';

definePublishStorageContract<EntityManager>(
  'TypeORM publish storage',
  async () => {
    const env = await createTypeOrmTestStorage();

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

definePublishStorageAdministrationContract(
  'TypeORM publish storage',
  async () => {
    const env = await createTypeOrmTestStorage();
    return { storage: env.publishStorage, cleanup: env.cleanup };
  },
);
