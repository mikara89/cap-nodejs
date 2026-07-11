[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-prisma/src](../README.md) / PrismaCapClient

# Interface: PrismaCapClient

Defined in: cap-storage-prisma/src/prisma-cap-client.ts:15

## Extends

- [`PrismaCapExecutor`](PrismaCapExecutor.md)

## Methods

### $executeRawUnsafe()

> **$executeRawUnsafe**(`query`, ...`values`): `Promise`\<`number`\>

Defined in: cap-storage-prisma/src/prisma-cap-client.ts:4

#### Parameters

##### query

`string`

##### values

...`unknown`[]

#### Returns

`Promise`\<`number`\>

#### Inherited from

[`PrismaCapExecutor`](PrismaCapExecutor.md).[`$executeRawUnsafe`](PrismaCapExecutor.md#executerawunsafe)

***

### $queryRawUnsafe()

> **$queryRawUnsafe**\<`T`\>(`query`, ...`values`): `Promise`\<`T`\>

Defined in: cap-storage-prisma/src/prisma-cap-client.ts:6

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### query

`string`

##### values

...`unknown`[]

#### Returns

`Promise`\<`T`\>

#### Inherited from

[`PrismaCapExecutor`](PrismaCapExecutor.md).[`$queryRawUnsafe`](PrismaCapExecutor.md#queryrawunsafe)

***

### $transaction()

> **$transaction**\<`T`\>(`fn`, `options?`): `Promise`\<`T`\>

Defined in: cap-storage-prisma/src/prisma-cap-client.ts:16

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`tx`) => `Promise`\<`T`\>

##### options?

[`PrismaCapTransactionOptions`](PrismaCapTransactionOptions.md)

#### Returns

`Promise`\<`T`\>
