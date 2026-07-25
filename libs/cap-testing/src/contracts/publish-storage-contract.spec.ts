import { createInMemoryPublishStorage } from '@mikara89/cap-core';
import { definePublishStorageContract } from './publish-storage-contract';
import { definePublishStorageAdministrationContract } from './publish-storage-administration-contract';

definePublishStorageContract(
  'in-memory publish storage',
  () =>
    Promise.resolve({
      storage: createInMemoryPublishStorage(),
      cleanup: () => Promise.resolve(),
    }),
  {
    supportsTransactions: false,
    supportsRollback: false,
    supportsSafeConcurrentClaiming: false,
    supportsClaimOwnershipFencing: true,
    supportsClaimLeaseRenewal: true,
  },
);

definePublishStorageAdministrationContract('in-memory publish storage', () =>
  Promise.resolve({
    storage: createInMemoryPublishStorage(),
    cleanup: () => Promise.resolve(),
  }),
);
