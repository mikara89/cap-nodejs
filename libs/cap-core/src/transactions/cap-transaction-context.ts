import { AsyncLocalStorage } from 'node:async_hooks';

import { type CapOperationContext } from '../models/cap-operation-context';

export class CapTransactionContext<TTx = unknown> {
  private readonly storage = new AsyncLocalStorage<CapOperationContext<TTx>>();

  run<T>(ctx: CapOperationContext<TTx>, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(ctx, fn);
  }

  current(): CapOperationContext<TTx> | undefined {
    return this.storage.getStore();
  }
}
