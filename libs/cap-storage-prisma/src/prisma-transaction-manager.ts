import type { Prisma } from '@prisma/client';
import {
  CapTransactionContext,
  type CapOperationContext,
  type CapTransactionManagerPort,
  type CapTransactionOptions,
} from '@mikara89/cap-core';
import type {
  PrismaCapClient,
  PrismaCapTransactionOptions,
} from './prisma-cap-client';
import type { PrismaStorageOptions } from './prisma-storage-options';
import { resolvePrismaStorageProvider } from './prisma-storage-options';

export class PrismaTransactionManager implements CapTransactionManagerPort<Prisma.TransactionClient> {
  private readonly context =
    new CapTransactionContext<Prisma.TransactionClient>();

  constructor(
    private readonly client: PrismaCapClient,
    private readonly options: Pick<PrismaStorageOptions, 'provider'>,
  ) {}

  async runInTransaction<T>(
    options: CapTransactionOptions,
    fn: (ctx: CapOperationContext<Prisma.TransactionClient>) => Promise<T>,
  ): Promise<T> {
    const afterCommit: Array<() => void | Promise<void>> = [];
    const afterRollback: Array<(error: unknown) => void | Promise<void>> = [];

    try {
      const result = await this.client.$transaction(async (tx) => {
        const ctx: CapOperationContext<Prisma.TransactionClient> = {
          tx,
          metadata: { options },
          afterCommit: (callback) => afterCommit.push(callback),
          afterRollback: (callback) => afterRollback.push(callback),
        };

        return this.context.run(ctx, () => fn(ctx));
      }, this.mapTransactionOptions(options));

      for (const callback of afterCommit) {
        await callback();
      }

      return result;
    } catch (err) {
      for (const callback of afterRollback) {
        await callback(err);
      }
      throw err;
    }
  }

  getCurrentContext():
    | CapOperationContext<Prisma.TransactionClient>
    | undefined {
    return this.context.current();
  }

  afterCommit(fn: () => void | Promise<void>): void {
    const ctx = this.context.current();
    if (!ctx?.afterCommit) {
      throw new Error('No active Prisma transaction context');
    }
    ctx.afterCommit(fn);
  }

  afterRollback(fn: (error: unknown) => void | Promise<void>): void {
    const ctx = this.context.current();
    if (!ctx?.afterRollback) {
      throw new Error('No active Prisma transaction context');
    }
    ctx.afterRollback(fn);
  }

  private mapTransactionOptions(
    options: CapTransactionOptions,
  ): PrismaCapTransactionOptions | undefined {
    const mapped: PrismaCapTransactionOptions = {};

    if (options.timeoutMs !== undefined) {
      mapped.timeout = options.timeoutMs;
    }
    if (options.isolationLevel !== undefined) {
      mapped.isolationLevel = this.mapIsolationLevel(options.isolationLevel);
    }

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }

  private mapIsolationLevel(value: string): Prisma.TransactionIsolationLevel {
    const provider = resolvePrismaStorageProvider(this.options.provider);
    const supported =
      provider === 'sqlite'
        ? ['Serializable']
        : [
            'ReadUncommitted',
            'ReadCommitted',
            'RepeatableRead',
            'Serializable',
          ];

    if (!supported.includes(value)) {
      throw new Error(
        `Prisma provider ${provider} does not support transaction isolation level "${value}". Supported values: ${supported.join(
          ', ',
        )}.`,
      );
    }

    return value as Prisma.TransactionIsolationLevel;
  }
}
