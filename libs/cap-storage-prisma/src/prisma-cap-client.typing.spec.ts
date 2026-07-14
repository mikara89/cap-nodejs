import type * as PrismaClientModule from '@prisma/client';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaCapClient, PrismaCapExecutor } from './prisma-cap-client';

type PrismaClientConstructor = typeof PrismaClientModule.PrismaClient;

type IsAssignable<Source, Target> = Source extends Target ? true : false;

const generatedClientIsConstructible: IsAssignable<
  InstanceType<PrismaClientConstructor>,
  PrismaClient
> = true;
const rootClientIsExecutor: IsAssignable<PrismaClient, PrismaCapExecutor> =
  true;
const rootClientSupportsTransactions: IsAssignable<
  PrismaClient,
  PrismaCapClient
> = true;
const transactionClientIsExecutor: IsAssignable<
  Prisma.TransactionClient,
  PrismaCapExecutor
> = true;
const connectIsTyped: IsAssignable<
  ReturnType<PrismaClient['$connect']>,
  Promise<void>
> = true;
const disconnectIsTyped: IsAssignable<
  ReturnType<PrismaClient['$disconnect']>,
  Promise<void>
> = true;

interface TypedRow {
  id: string;
}

function preserveTransactionResult(client: PrismaCapClient): Promise<TypedRow> {
  return client.$transaction(async (tx) => {
    const executor: PrismaCapExecutor = tx;
    await executor.$executeRawUnsafe('SELECT 1');
    return { id: 'typed-result' };
  });
}

function preserveRawQueryResult(
  executor: PrismaCapExecutor,
): Promise<TypedRow[]> {
  return executor.$queryRawUnsafe<TypedRow[]>('SELECT 1');
}

const structuralTestClient: PrismaCapClient = {
  $executeRawUnsafe(): Promise<number> {
    return Promise.resolve(0);
  },
  $queryRawUnsafe<T = unknown>(): Promise<T> {
    return Promise.reject(new Error('Type-only structural test client'));
  },
  $transaction<T>(): Promise<T> {
    return Promise.reject(new Error('Type-only structural test client'));
  },
};

describe('Prisma generated-client typing', () => {
  it('keeps generated clients compatible with the narrow CAP boundary', () => {
    expect([
      generatedClientIsConstructible,
      rootClientIsExecutor,
      rootClientSupportsTransactions,
      transactionClientIsExecutor,
      connectIsTyped,
      disconnectIsTyped,
    ]).toEqual([true, true, true, true, true, true]);
  });

  it('preserves transaction, raw-query, and structural test-client types', () => {
    expect(typeof preserveTransactionResult).toBe('function');
    expect(typeof preserveRawQueryResult).toBe('function');
    expect(structuralTestClient).toBeDefined();
  });
});
