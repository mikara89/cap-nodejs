import type { DataSource } from 'typeorm';
import type { CapStorageCapabilities } from '@mikara89/cap-core';
import { supportsTypeOrmSkipLockedClaiming } from './typeorm-storage-utils';

export function getTypeOrmStorageCapabilities(
  dataSource: DataSource,
): CapStorageCapabilities {
  return {
    transactions: true,
    skipLockedClaiming: supportsTypeOrmSkipLockedClaiming(dataSource),
    advisoryLocks: false,
    atomicInsertIgnore: false,
    nestedTransactions: false,
    isolationLevels: [],
  };
}
