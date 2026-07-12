[**CAP Node.js API**](../../../../README.md)

***

[CAP Node.js API](../../../../README.md) / [cap-storage-prisma/src/nest](../README.md) / PrismaStorageModule

# Class: PrismaStorageModule

Defined in: [cap-storage-prisma/src/nest/prisma-storage.module.ts:44](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/nest/prisma-storage.module.ts#L44)

NestJS module providing Prisma-based storage adapters for CAP.

## Constructors

### Constructor

> **new PrismaStorageModule**(): `PrismaStorageModule`

#### Returns

`PrismaStorageModule`

## Methods

### forRoot()

> `static` **forRoot**(`options`): `DynamicModule`

Defined in: [cap-storage-prisma/src/nest/prisma-storage.module.ts:45](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/nest/prisma-storage.module.ts#L45)

#### Parameters

##### options

[`PrismaStorageModuleOptions`](../interfaces/PrismaStorageModuleOptions.md)

#### Returns

`DynamicModule`

***

### forRootAsync()

> `static` **forRootAsync**(`options`): `DynamicModule`

Defined in: [cap-storage-prisma/src/nest/prisma-storage.module.ts:52](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/nest/prisma-storage.module.ts#L52)

#### Parameters

##### options

[`PrismaStorageModuleAsyncOptions`](../interfaces/PrismaStorageModuleAsyncOptions.md)

#### Returns

`DynamicModule`
