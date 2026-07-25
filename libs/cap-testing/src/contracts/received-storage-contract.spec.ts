import { createInMemoryReceivedStorage } from '@mikara89/cap-core';
import { defineReceivedStorageContract } from './received-storage-contract';
import { defineReceivedStorageAdministrationContract } from './received-storage-administration-contract';

defineReceivedStorageContract(
  'in-memory received storage',
  () =>
    Promise.resolve({
      storage: createInMemoryReceivedStorage(),
      cleanup: () => Promise.resolve(),
    }),
  {
    supportsAtomicInsertIgnore: false,
    supportsSafeConcurrentInsert: false,
  },
);

defineReceivedStorageAdministrationContract('in-memory received storage', () =>
  Promise.resolve({
    storage: createInMemoryReceivedStorage(),
    cleanup: () => Promise.resolve(),
  }),
);
