import type { Prisma } from '@prisma/client';
import {
  definePublishStorageAdministrationContract,
  definePublishStorageContract,
} from '@mikara89/cap-testing';
import { createPrismaTestStorage } from './testing/create-prisma-test-storage';

definePublishStorageContract<Prisma.TransactionClient>(
  'Prisma publish storage',
  async () => {
    const env = await createPrismaTestStorage();

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
  'Prisma publish storage',
  async () => {
    const env = await createPrismaTestStorage();
    return { storage: env.publishStorage, cleanup: env.cleanup };
  },
);
