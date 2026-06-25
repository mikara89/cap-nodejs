[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapTransactionManagerPort

# Interface: CapTransactionManagerPort\<TTx\>

Defined in: cap-core/dist/ports/transaction-manager.port.d.ts:9

## Type Parameters

### TTx

`TTx` = `unknown`

## Methods

### afterCommit()?

> `optional` **afterCommit**(`fn`): `void`

Defined in: cap-core/dist/ports/transaction-manager.port.d.ts:12

#### Parameters

##### fn

() => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### afterRollback()?

> `optional` **afterRollback**(`fn`): `void`

Defined in: cap-core/dist/ports/transaction-manager.port.d.ts:13

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### getCurrentContext()?

> `optional` **getCurrentContext**(): [`CapOperationContext`](CapOperationContext.md)\<`TTx`\> \| `undefined`

Defined in: cap-core/dist/ports/transaction-manager.port.d.ts:11

#### Returns

[`CapOperationContext`](CapOperationContext.md)\<`TTx`\> \| `undefined`

***

### runInTransaction()

> **runInTransaction**\<`T`\>(`options`, `fn`): `Promise`\<`T`\>

Defined in: cap-core/dist/ports/transaction-manager.port.d.ts:10

#### Type Parameters

##### T

`T`

#### Parameters

##### options

[`CapTransactionOptions`](CapTransactionOptions.md)

##### fn

(`ctx`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
