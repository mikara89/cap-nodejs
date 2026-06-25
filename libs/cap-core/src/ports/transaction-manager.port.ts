import { type CapOperationContext } from '../models/cap-operation-context';

export type CapTransactionPropagation =
  | 'required'
  | 'requiresNew'
  | 'nested'
  | 'supports'
  | 'mandatory'
  | 'never';

export interface CapTransactionOptions {
  isolationLevel?: string;
  propagation?: CapTransactionPropagation;
  timeoutMs?: number;
  readOnly?: boolean;
}

export interface CapTransactionManagerPort<TTx = unknown> {
  runInTransaction<T>(
    options: CapTransactionOptions,
    fn: (ctx: CapOperationContext<TTx>) => Promise<T>,
  ): Promise<T>;

  getCurrentContext?(): CapOperationContext<TTx> | undefined;

  afterCommit?(fn: () => void | Promise<void>): void;

  afterRollback?(fn: (error: unknown) => void | Promise<void>): void;
}
