import {
  CapTransactionContext,
  type CapOperationContext,
  type CapTransactionManagerPort,
  type CapTransactionOptions,
} from '@mikara89/cap-core';
import type { DataSource, EntityManager } from 'typeorm';

export class TypeOrmTransactionManager implements CapTransactionManagerPort<EntityManager> {
  private readonly context = new CapTransactionContext<EntityManager>();

  constructor(private readonly dataSource: DataSource) {}

  async runInTransaction<T>(
    options: CapTransactionOptions,
    fn: (ctx: CapOperationContext<EntityManager>) => Promise<T>,
  ): Promise<T> {
    const afterCommit: Array<() => void | Promise<void>> = [];
    const afterRollback: Array<(error: unknown) => void | Promise<void>> = [];

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const ctx: CapOperationContext<EntityManager> = {
          tx: manager,
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

  getCurrentContext(): CapOperationContext<EntityManager> | undefined {
    return this.context.current();
  }

  afterCommit(fn: () => void | Promise<void>): void {
    const ctx = this.context.current();
    if (!ctx?.afterCommit) {
      throw new Error('No active TypeORM transaction context');
    }
    ctx.afterCommit(fn);
  }

  afterRollback(fn: (error: unknown) => void | Promise<void>): void {
    const ctx = this.context.current();
    if (!ctx?.afterRollback) {
      throw new Error('No active TypeORM transaction context');
    }
    ctx.afterRollback(fn);
  }
}
