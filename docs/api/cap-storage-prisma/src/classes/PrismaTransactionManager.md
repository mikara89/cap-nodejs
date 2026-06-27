[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-prisma/src](../README.md) / PrismaTransactionManager

# Class: PrismaTransactionManager

Defined in: cap-storage-prisma/src/prisma-transaction-manager.ts:15

## Implements

- [`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md)\<`Prisma.TransactionClient`\>

## Constructors

### Constructor

> **new PrismaTransactionManager**(`client`, `options`): `PrismaTransactionManager`

Defined in: cap-storage-prisma/src/prisma-transaction-manager.ts:19

#### Parameters

##### client

[`PrismaCapClient`](../interfaces/PrismaCapClient.md)

##### options

`Pick`\<[`PrismaStorageOptions`](../interfaces/PrismaStorageOptions.md), `"provider"`\>

#### Returns

`PrismaTransactionManager`

## Methods

### afterCommit()

> **afterCommit**(`fn`): `void`

Defined in: cap-storage-prisma/src/prisma-transaction-manager.ts:62

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

Defined in: cap-storage-prisma/src/prisma-transaction-manager.ts:70

#### Parameters

##### fn

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`void`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`afterRollback`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#afterrollback)

***

### getCurrentContext()

> **getCurrentContext**(): [`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`TransactionClient`\> \| `undefined`

Defined in: cap-storage-prisma/src/prisma-transaction-manager.ts:56

#### Returns

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`TransactionClient`\> \| `undefined`

#### Implementation of

[`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md).[`getCurrentContext`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md#getcurrentcontext)

***

### runInTransaction()

> **runInTransaction**\<`T`\>(`options`, `fn`): `Promise`\<`T`\>

Defined in: cap-storage-prisma/src/prisma-transaction-manager.ts:24

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
