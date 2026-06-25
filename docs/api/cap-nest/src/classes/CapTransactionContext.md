[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapTransactionContext

# Class: CapTransactionContext\<TTx\>

Defined in: cap-core/dist/transactions/cap-transaction-context.d.ts:2

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

Defined in: cap-core/dist/transactions/cap-transaction-context.d.ts:5

#### Returns

[`CapOperationContext`](../interfaces/CapOperationContext.md)\<`TTx`\> \| `undefined`

***

### run()

> **run**\<`T`\>(`ctx`, `fn`): `Promise`\<`T`\>

Defined in: cap-core/dist/transactions/cap-transaction-context.d.ts:4

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
