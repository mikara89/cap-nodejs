import {
  defineReceivedStorageAdministrationContract,
  defineReceivedStorageContract,
} from '@mikara89/cap-testing';
import { createKnexTestStorage } from './testing/create-knex-test-storage';

defineReceivedStorageContract(
  'Knex received storage',
  async () => {
    const env = await createKnexTestStorage();

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

defineReceivedStorageAdministrationContract(
  'Knex received storage',
  async () => {
    const env = await createKnexTestStorage();
    return { storage: env.receivedStorage, cleanup: env.cleanup };
  },
);
