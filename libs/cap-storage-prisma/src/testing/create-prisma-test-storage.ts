import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { PrismaCapClient } from '../prisma-cap-client';
import { initializePrismaCapStorage } from '../prisma-cap-schema';
import { PrismaPublishStorage } from '../prisma-publish-storage';
import { PrismaReceivedStorage } from '../prisma-received-storage';
import { PrismaTransactionManager } from '../prisma-transaction-manager';

export interface PrismaTestStorage {
  client: PrismaClient;
  capClient: PrismaCapClient;
  publishStorage: PrismaPublishStorage;
  receivedStorage: PrismaReceivedStorage;
  transactionManager: PrismaTransactionManager;
  cleanup: () => Promise<void>;
}

export async function createPrismaTestStorage(): Promise<PrismaTestStorage> {
  const databasePath = join(
    tmpdir(),
    `cap-storage-prisma-${randomUUID()}.sqlite`,
  ).replaceAll('\\', '/');
  const client = new PrismaClient({
    datasourceUrl: `file:${databasePath}`,
  });
  const capClient = client as unknown as PrismaCapClient;
  const options = { provider: 'sqlite' as const };

  await client.$connect();
  await initializePrismaCapStorage(capClient, options);

  return {
    client,
    capClient,
    publishStorage: new PrismaPublishStorage(capClient, options),
    receivedStorage: new PrismaReceivedStorage(capClient, options),
    transactionManager: new PrismaTransactionManager(capClient, options),
    cleanup: async () => {
      await client.$disconnect();
      await rm(databasePath, { force: true });
    },
  };
}
