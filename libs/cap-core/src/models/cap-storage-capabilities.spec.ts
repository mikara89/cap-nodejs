import type {
  CapabilityAwareStoragePort,
  CapStorageCapabilities,
} from '../index';

describe('storage capability model exports', () => {
  it('exports CapStorageCapabilities and CapabilityAwareStoragePort from cap-core', () => {
    const capabilities: CapStorageCapabilities = {
      transactions: true,
      skipLockedClaiming: false,
      advisoryLocks: false,
      atomicInsertIgnore: false,
      nestedTransactions: false,
      isolationLevels: [],
    };
    const storage: CapabilityAwareStoragePort = {
      getCapabilities: () => capabilities,
    };

    expect(storage.getCapabilities()).toEqual(capabilities);
  });
});
