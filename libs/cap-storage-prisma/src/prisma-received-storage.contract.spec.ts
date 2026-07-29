import {
  defineReceivedStorageAdministrationContract,
  defineReceivedStorageContract,
} from '@mikara89/cap-testing';
import { createPrismaTestStorage } from './testing/create-prisma-test-storage';

jest.setTimeout(30_000);

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

defineReceivedStorageAdministrationContract(
  'Prisma received storage',
  async () => {
    const env = await createPrismaTestStorage();
    return { storage: env.receivedStorage, cleanup: env.cleanup };
  },
);
