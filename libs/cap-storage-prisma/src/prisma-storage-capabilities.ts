import type { CapStorageCapabilities } from '@mikara89/cap-core';
import type { PrismaStorageProvider } from './prisma-storage-options';
import { resolvePrismaStorageProvider } from './prisma-storage-options';

export function getPrismaStorageCapabilities(
  provider: PrismaStorageProvider,
): CapStorageCapabilities {
  const resolved = resolvePrismaStorageProvider(provider);

  return {
    transactions: true,
    skipLockedClaiming: resolved !== 'sqlite',
    claimOwnershipFencing: true,
    claimLeaseRenewal: true,
    advisoryLocks: false,
    atomicInsertIgnore: true,
    nestedTransactions: false,
    isolationLevels:
      resolved === 'sqlite'
        ? ['Serializable']
        : [
            'ReadUncommitted',
            'ReadCommitted',
            'RepeatableRead',
            'Serializable',
          ],
  };
}
