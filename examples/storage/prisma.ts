import type { PrismaClient } from '@prisma/client';
import {
  CapEngine,
  createInMemoryPublisher,
  createInMemorySubscriber,
} from '@mikara89/cap-core';
import {
  initializePrismaCapStorage,
  PrismaPublishStorage,
  PrismaReceivedStorage,
  PrismaTransactionManager,
} from '@mikara89/cap-storage-prisma';

const options = { provider: 'postgresql' as const };

export async function createPrismaCapEngine(
  prisma: PrismaClient,
): Promise<CapEngine> {
  // CAP creates its own raw-SQL tables; no CAP models are needed in schema.prisma.
  await initializePrismaCapStorage(prisma, options);

  return new CapEngine({
    publishStorage: new PrismaPublishStorage(prisma, options),
    receivedStorage: new PrismaReceivedStorage(prisma, options),
    transactionManager: new PrismaTransactionManager(prisma, options),
    publisher: createInMemoryPublisher(),
    subscriber: createInMemorySubscriber(),
  });
}

export async function publishWithPrismaTransaction(
  engine: CapEngine,
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await engine.publish('example.prisma.tx', { id: '1' }, { tx });
  });
}

export async function publishWithPrismaContext(
  engine: CapEngine,
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await engine.publish('example.prisma.ctx', { id: '2' }, { ctx: { tx } });
  });
}
