import { defineReceivedStorageContract } from '@mikara89/cap-testing';
import { createTypeOrmTestStorage } from './testing/create-typeorm-test-storage';

defineReceivedStorageContract(
  'TypeORM received storage',
  async () => {
    const env = await createTypeOrmTestStorage();

    return {
      storage: env.receivedStorage,
      cleanup: env.cleanup,
    };
  },
  {
    supportsAtomicInsertIgnore: false,
    supportsSafeConcurrentInsert: false,
  },
);
