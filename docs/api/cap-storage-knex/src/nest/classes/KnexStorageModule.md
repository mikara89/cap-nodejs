[**CAP Node.js API**](../../../../README.md)

***

[CAP Node.js API](../../../../README.md) / [cap-storage-knex/src/nest](../README.md) / KnexStorageModule

# Class: KnexStorageModule

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L42)

NestJS module providing Knex-based storage adapters for CAP.

## Constructors

### Constructor

> **new KnexStorageModule**(): `KnexStorageModule`

#### Returns

`KnexStorageModule`

## Methods

### forRoot()

> `static` **forRoot**(`options`): `DynamicModule`

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:43](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L43)

#### Parameters

##### options

[`KnexStorageModuleOptions`](../interfaces/KnexStorageModuleOptions.md)

#### Returns

`DynamicModule`

***

### forRootAsync()

> `static` **forRootAsync**(`options`): `DynamicModule`

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L50)

#### Parameters

##### options

[`KnexStorageModuleAsyncOptions`](../interfaces/KnexStorageModuleAsyncOptions.md)

#### Returns

`DynamicModule`
