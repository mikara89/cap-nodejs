export interface CapStorageCapabilities {
  transactions: boolean;
  skipLockedClaiming: boolean;
  claimOwnershipFencing?: boolean;
  claimLeaseRenewal?: boolean;
  advisoryLocks: boolean;
  atomicInsertIgnore: boolean;
  nestedTransactions: boolean;
  isolationLevels: string[];
}

export interface CapabilityAwareStoragePort {
  getCapabilities(): CapStorageCapabilities;
}
