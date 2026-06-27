import type { Prisma } from '@prisma/client';

export interface PrismaCapExecutor {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;

  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
}

export interface PrismaCapTransactionOptions {
  isolationLevel?: Prisma.TransactionIsolationLevel;
  maxWait?: number;
  timeout?: number;
}

export interface PrismaCapClient extends PrismaCapExecutor {
  $transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: PrismaCapTransactionOptions,
  ): Promise<T>;
}
