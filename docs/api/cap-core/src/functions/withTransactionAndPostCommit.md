[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / withTransactionAndPostCommit

# Function: withTransactionAndPostCommit()

> **withTransactionAndPostCommit**\<`T`, `Item`, `Tx`\>(`runnerOrOrm`, `transactionalFn`, `afterCommitFn`): `Promise`\<`T`\>

Defined in: [cap-core/src/utils/transaction.util.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/utils/transaction.util.ts#L9)

Helper that runs a transactional function and then executes an after-commit
callback with items that were queued during the transaction.

This utility is intentionally transport/storage-agnostic: callers can pass
either a transaction-runner function `(fn) => Promise<T>` or an ORM-like
object that exposes `em.transactional(fn)`.

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
