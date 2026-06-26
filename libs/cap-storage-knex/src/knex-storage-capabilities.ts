import type { Knex } from 'knex';
import type { CapStorageCapabilities } from '@mikara89/cap-core';
import {
  getKnexClientName,
  supportsSkipLockedClaiming,
} from './knex-storage-utils';

export function getKnexStorageCapabilities(knex: Knex): CapStorageCapabilities {
  const clientName = getKnexClientName(knex);
  const skipLockedClaiming = supportsSkipLockedClaiming(knex);

  return {
    transactions: true,
    skipLockedClaiming,
    advisoryLocks: false,
    atomicInsertIgnore: false,
    nestedTransactions: false,
    isolationLevels: isolationLevelsFor(clientName),
  };
}

function isolationLevelsFor(clientName: string): string[] {
  if (
    clientName.includes('pg') ||
    clientName.includes('postgres') ||
    clientName.includes('mysql') ||
    clientName.includes('maria')
  ) {
    return ['read committed', 'repeatable read', 'serializable'];
  }

  return [];
}
