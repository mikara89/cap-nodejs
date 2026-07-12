[**CAP Node.js API**](../../../../README.md)

***

[CAP Node.js API](../../../../README.md) / [cap-storage-typeorm/src/nest](../README.md) / TypeOrmStorageModule

# Class: TypeOrmStorageModule

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:45](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L45)

NestJS module providing TypeORM-based storage adapters for CAP.

## Constructors

### Constructor

> **new TypeOrmStorageModule**(): `TypeOrmStorageModule`

#### Returns

`TypeOrmStorageModule`

## Methods

### forRoot()

> `static` **forRoot**(`options?`): `DynamicModule`

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:46](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L46)

#### Parameters

##### options?

[`TypeOrmStorageModuleOptions`](../interfaces/TypeOrmStorageModuleOptions.md) = `{}`

#### Returns

`DynamicModule`

***

### forRootAsync()

> `static` **forRootAsync**(`options`): `DynamicModule`

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L57)

#### Parameters

##### options

[`TypeOrmStorageModuleAsyncOptions`](../interfaces/TypeOrmStorageModuleAsyncOptions.md)

#### Returns

`DynamicModule`
