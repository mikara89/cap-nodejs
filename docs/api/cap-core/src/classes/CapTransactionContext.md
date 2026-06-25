[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapTransactionContext

# Class: CapTransactionContext\<TTx\>

Defined in: [cap-core/src/transactions/cap-transaction-context.ts:5](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/transactions/cap-transaction-context.ts#L5)

## Type Parameters

### TTx

`TTx` = `unknown`

## Constructors

### Constructor

> **new CapTransactionContext**\<`TTx`\>(): `CapTransactionContext`\<`TTx`\>

#### Returns

`CapTransactionContext`\<`TTx`\>

## Methods

### current()

> **current**(): [`CapOperationContext`](../interfaces/CapOperationContext.md)\<`TTx`\> \| `undefined`

Defined in: [cap-core/src/transactions/cap-transaction-context.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/transactions/cap-transaction-context.ts#L12)

#### Returns

[`CapOperationContext`](../interfaces/CapOperationContext.md)\<`TTx`\> \| `undefined`

***

### run()

> **run**\<`T`\>(`ctx`, `fn`): `Promise`\<`T`\>

Defined in: [cap-core/src/transactions/cap-transaction-context.ts:8](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/transactions/cap-transaction-context.ts#L8)

#### Type Parameters

##### T

`T`

#### Parameters

##### ctx

[`CapOperationContext`](../interfaces/CapOperationContext.md)\<`TTx`\>

##### fn

() => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
