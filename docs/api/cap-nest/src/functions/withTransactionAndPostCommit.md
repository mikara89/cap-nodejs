[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / withTransactionAndPostCommit

# Function: withTransactionAndPostCommit()

> **withTransactionAndPostCommit**\<`T`, `Item`, `Tx`\>(`runnerOrOrm`, `transactionalFn`, `afterCommitFn`): `Promise`\<`T`\>

Defined in: [cap-nest/src/cap/utils/transaction.util.ts:10](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/utils/transaction.util.ts#L10)

Helper that runs a transactional function and then executes an after-commit
callback with items that were queued during the transaction.

This utility is intentionally transport/storage-agnostic: callers can pass
either a transaction-runner function `(fn) => Promise<T>` or an ORM-like
object that exposes `em.transactional(fn)` (keeps backwards compatibility
with MikroORM without importing it here).

## Type Parameters

### T

`T`

### Item

`Item` = `unknown`

### Tx

`Tx` = `unknown`

## Parameters

### runnerOrOrm

\{ `em?`: \{ `transactional`: (`fn`) => `Promise`\<`T`\>; \}; \} \| ((`fn`) => `Promise`\<`T`\>)

### transactionalFn

(`tx`, `queueForPostCommit`) => `Promise`\<`T`\>

### afterCommitFn

(`items`) => `Promise`\<`void`\>

## Returns

`Promise`\<`T`\>
