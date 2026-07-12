import type { EntityManager } from '@mikro-orm/core';
import type { CapStorageCapabilities } from '@mikara89/cap-core';

export function getMikroStorageCapabilities(
  em: EntityManager,
): CapStorageCapabilities {
  return {
    transactions: true,
    skipLockedClaiming: supportsSkipLockedClaiming(em),
    claimOwnershipFencing: true,
    claimLeaseRenewal: true,
    advisoryLocks: false,
    atomicInsertIgnore: false,
    nestedTransactions: false,
    isolationLevels: [],
  };
}

export function supportsSkipLockedClaiming(em: EntityManager): boolean {
  const platformName = getMikroPlatformName(em);
  return Boolean(
    platformName &&
    (platformName.includes('postgres') || platformName.includes('mysql')),
  );
}

export function getMikroPlatformName(em: EntityManager): string | undefined {
  const maybeDriver = (
    em as unknown as {
      getDriver?: () => {
        getPlatform?: () => { constructor?: { name?: string } };
      };
    }
  ).getDriver?.();
  return maybeDriver?.getPlatform?.()?.constructor?.name?.toLowerCase();
}
