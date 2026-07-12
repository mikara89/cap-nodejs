[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-typeorm/src](../README.md) / TypeOrmTransactionManager

# Class: TypeOrmTransactionManager

Defined in: [cap-storage-typeorm/src/typeorm-transaction-manager.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-transaction-manager.ts#L9)

## Implements

- [`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md)\<`EntityManager`\>

## Constructors

### Constructor

> **new TypeOrmTransactionManager**(`dataSource`): `TypeOrmTransactionManager`

Defined in: [cap-storage-typeorm/src/typeorm-transaction-manager.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-transaction-manager.ts#L12)

#### Parameters

##### dataSource

`DataSource`

#### Returns

`TypeOrmTransactionManager`

## Methods

### afterCommit()

> **afterCommit**(`fn`): `void`

Defined in: [cap-storage-typeorm/src/typeorm-transaction-manager.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-transaction-manager.ts#L50)

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

Defined in: [cap-storage-typeorm/src/typeorm-transaction-manager.ts:58](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-transaction-manager.ts#L58)

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`afterRollback`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#afterrollback)

***

### getCurrentContext()

> **getCurrentContext**(): [`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`EntityManager`\> \| `undefined`

Defined in: [cap-storage-typeorm/src/typeorm-transaction-manager.ts:46](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-transaction-manager.ts#L46)

#### Returns

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`EntityManager`\> \| `undefined`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`getCurrentContext`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#getcurrentcontext)

***

### runInTransaction()

> **runInTransaction**\<`T`\>(`options`, `fn`): `Promise`\<`T`\>

Defined in: [cap-storage-typeorm/src/typeorm-transaction-manager.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-transaction-manager.ts#L14)

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
