[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-knex/src](../README.md) / KnexTransactionManager

# Class: KnexTransactionManager

Defined in: [cap-storage-knex/src/knex-transaction-manager.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-transaction-manager.ts#L11)

## Implements

- [`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md)\<`Knex.Transaction`\>

## Constructors

### Constructor

> **new KnexTransactionManager**(`knex`): `KnexTransactionManager`

Defined in: [cap-storage-knex/src/knex-transaction-manager.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-transaction-manager.ts#L14)

#### Parameters

##### knex

`Knex`

#### Returns

`KnexTransactionManager`

## Methods

### afterCommit()

> **afterCommit**(`fn`): `void`

Defined in: [cap-storage-knex/src/knex-transaction-manager.ts:52](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-transaction-manager.ts#L52)

#### Parameters

##### fn

() => `void` \| `Promise`\<`void`\>

#### Returns

`void`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`afterCommit`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#aftercommit)

***

### afterRollback()

> **afterRollback**(`fn`): `void`

Defined in: [cap-storage-knex/src/knex-transaction-manager.ts:60](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-transaction-manager.ts#L60)

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`afterRollback`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#afterrollback)

***

### getCurrentContext()

> **getCurrentContext**(): [`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`Transaction`\<`any`, `any`[]\>\> \| `undefined`

Defined in: [cap-storage-knex/src/knex-transaction-manager.ts:48](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-transaction-manager.ts#L48)

#### Returns

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`Transaction`\<`any`, `any`[]\>\> \| `undefined`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`getCurrentContext`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#getcurrentcontext)

***

### runInTransaction()

> **runInTransaction**\<`T`\>(`options`, `fn`): `Promise`\<`T`\>

Defined in: [cap-storage-knex/src/knex-transaction-manager.ts:16](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-transaction-manager.ts#L16)

#### Type Parameters

##### T

`T`

#### Parameters

##### options

[`CapTransactionOptions`](../../../cap-nest/src/interfaces/CapTransactionOptions.md)

##### fn

(`ctx`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`runInTransaction`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#runintransaction)
