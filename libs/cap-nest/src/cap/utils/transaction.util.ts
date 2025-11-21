import { MikroORM, type EntityManager } from '@mikro-orm/core';

/**
 * Helper that runs a transactional function and then executes an after-commit
 * callback with items that were queued during the transaction.
 *
 * The transactionalFn receives the transaction-scoped `EntityManager` and a
 * `queueForPostCommit` function to register items to run after commit.
 */
export async function withTransactionAndPostCommit<T, Item = unknown>(
    orm: MikroORM,
    transactionalFn: (
        em: EntityManager,
        queueForPostCommit: (item: Item) => void,
    ) => Promise<T>,
    afterCommitFn: (items: Item[]) => Promise<void>,
): Promise<T> {
    const postCommitQueue: Item[] = [];

    const result = await orm.em.transactional(async (em) => {
        const queueForPostCommit = (item: Item) => postCommitQueue.push(item);
        return transactionalFn(em, queueForPostCommit);
    });

    if (postCommitQueue.length > 0) {
        await afterCommitFn(postCommitQueue);
    }

    return result;
}

export type { EntityManager };
