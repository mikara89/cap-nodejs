import {
  CapTransactionContext,
  type CapTransactionManagerPort,
} from '@mikara89/cap-core';
import type {
  CapOperationContext,
  CapTransactionOptions,
} from '@mikara89/cap-core';
import type { Knex } from 'knex';

export class KnexTransactionManager implements CapTransactionManagerPort<Knex.Transaction> {
  private readonly context = new CapTransactionContext<Knex.Transaction>();

  constructor(private readonly knex: Knex) {}

  async runInTransaction<T>(
    options: CapTransactionOptions,
    fn: (ctx: CapOperationContext<Knex.Transaction>) => Promise<T>,
  ): Promise<T> {
    const afterCommit: Array<() => void | Promise<void>> = [];
    const afterRollback: Array<(error: unknown) => void | Promise<void>> = [];

    try {
      const result = await this.knex.transaction(async (tx) => {
        const ctx: CapOperationContext<Knex.Transaction> = {
          tx,
          metadata: { options },
          afterCommit: (callback) => afterCommit.push(callback),
          afterRollback: (callback) => afterRollback.push(callback),
        };

        return this.context.run(ctx, () => fn(ctx));
      });

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

  getCurrentContext(): CapOperationContext<Knex.Transaction> | undefined {
    return this.context.current();
  }

  afterCommit(fn: () => void | Promise<void>): void {
    const ctx = this.context.current();
    if (!ctx?.afterCommit) {
      throw new Error('No active Knex transaction context');
    }
    ctx.afterCommit(fn);
  }

  afterRollback(fn: (error: unknown) => void | Promise<void>): void {
    const ctx = this.context.current();
    if (!ctx?.afterRollback) {
      throw new Error('No active Knex transaction context');
    }
    ctx.afterRollback(fn);
  }
}
