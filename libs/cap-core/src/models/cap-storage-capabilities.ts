export interface CapStorageCapabilities {
  transactions: boolean;
  skipLockedClaiming: boolean;
  advisoryLocks: boolean;
  atomicInsertIgnore: boolean;
  nestedTransactions: boolean;
  isolationLevels: string[];
}

export interface CapabilityAwareStoragePort {
  getCapabilities(): CapStorageCapabilities;
}
