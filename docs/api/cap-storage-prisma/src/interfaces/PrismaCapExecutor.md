[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-prisma/src](../README.md) / PrismaCapExecutor

# Interface: PrismaCapExecutor

Defined in: [cap-storage-prisma/src/prisma-cap-client.ts:3](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-cap-client.ts#L3)

## Extended by

- [`PrismaCapClient`](PrismaCapClient.md)

## Methods

### $executeRawUnsafe()

> **$executeRawUnsafe**(`query`, ...`values`): `Promise`\<`number`\>

Defined in: [cap-storage-prisma/src/prisma-cap-client.ts:4](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-cap-client.ts#L4)

#### Parameters

##### query

`string`

##### values

...`unknown`[]

#### Returns

`Promise`\<`number`\>

***

### $queryRawUnsafe()

> **$queryRawUnsafe**\<`T`\>(`query`, ...`values`): `Promise`\<`T`\>

Defined in: [cap-storage-prisma/src/prisma-cap-client.ts:6](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-cap-client.ts#L6)

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
