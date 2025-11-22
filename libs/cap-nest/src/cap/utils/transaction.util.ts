/**
 * Helper that runs a transactional function and then executes an after-commit
 * callback with items that were queued during the transaction.
 *
 * This utility is intentionally transport/storage-agnostic: callers can pass
 * either a transaction-runner function `(fn) => Promise<T>` or an ORM-like
 * object that exposes `em.transactional(fn)` (keeps backwards compatibility
 * with MikroORM without importing it here).
 */
export async function withTransactionAndPostCommit<
  T,
  Item = unknown,
  Tx = unknown,
>(
  runnerOrOrm:
    | ((fn: (tx: Tx) => Promise<T>) => Promise<T>)
    | { em?: { transactional: (fn: (tx: Tx) => Promise<T>) => Promise<T> } },
  transactionalFn: (
    tx: Tx,
    queueForPostCommit: (item: Item) => void,
  ) => Promise<T>,
  afterCommitFn: (items: Item[]) => Promise<void>,
): Promise<T> {
  const postCommitQueue: Item[] = [];

  const runInTx: (fn: (tx: Tx) => Promise<T>) => Promise<T> = (() => {
    if (typeof runnerOrOrm === 'function')
      return runnerOrOrm as (fn: (tx: Tx) => Promise<T>) => Promise<T>;
    const maybeOrm = runnerOrOrm as
      | { em?: { transactional?: (fn: (tx: Tx) => Promise<T>) => Promise<T> } }
      | undefined;
    if (maybeOrm?.em && typeof maybeOrm.em.transactional === 'function') {
      const transactional = maybeOrm.em.transactional as (
        fn: (tx: Tx) => Promise<T>,
      ) => Promise<T>;
      return (fn: (tx: Tx) => Promise<T>) => transactional(fn);
    }
    throw new Error(
      'withTransactionAndPostCommit: invalid runnerOrOrm provided',
    );
  })();

  const result = await runInTx(async (tx) => {
    const queueForPostCommit = (item: Item): void => {
      postCommitQueue.push(item);
    };
    return transactionalFn(tx, queueForPostCommit);
  });

  if (postCommitQueue.length > 0) {
    await afterCommitFn(postCommitQueue);
  }

  return result;
}
