import { createInMemoryPublishStorage } from '@mikara89/cap-core';
import { definePublishStorageContract } from './publish-storage-contract';

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
