import { defineReceivedStorageContract } from '@mikara89/cap-testing';
import { createPrismaTestStorage } from './testing/create-prisma-test-storage';

defineReceivedStorageContract(
  'Prisma received storage',
  async () => {
    const env = await createPrismaTestStorage();

    return {
      storage: env.receivedStorage,
      cleanup: env.cleanup,
    };
  },
  {
    supportsAtomicInsertIgnore: true,
    supportsSafeConcurrentInsert: true,
  },
);
