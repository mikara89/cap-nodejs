[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapTransactionManagerPort

# Interface: CapTransactionManagerPort\<TTx\>

Defined in: [cap-core/src/ports/transaction-manager.port.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/transaction-manager.port.ts#L18)

## Type Parameters

### TTx

`TTx` = `unknown`

## Methods

### afterCommit()?

> `optional` **afterCommit**(`fn`): `void`

Defined in: [cap-core/src/ports/transaction-manager.port.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/transaction-manager.port.ts#L26)

#### Parameters

##### fn

() => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### afterRollback()?

> `optional` **afterRollback**(`fn`): `void`

Defined in: [cap-core/src/ports/transaction-manager.port.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/transaction-manager.port.ts#L28)

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

***

### getCurrentContext()?

> `optional` **getCurrentContext**(): [`CapOperationContext`](CapOperationContext.md)\<`TTx`\> \| `undefined`

Defined in: [cap-core/src/ports/transaction-manager.port.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/transaction-manager.port.ts#L24)

#### Returns

[`CapOperationContext`](CapOperationContext.md)\<`TTx`\> \| `undefined`

***

### runInTransaction()

> **runInTransaction**\<`T`\>(`options`, `fn`): `Promise`\<`T`\>

Defined in: [cap-core/src/ports/transaction-manager.port.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/transaction-manager.port.ts#L19)

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
