[**CAP Node.js API**](../../../../README.md)

***

[CAP Node.js API](../../../../README.md) / [cap-storage-knex/src/nest](../README.md) / KnexStorageModuleAsyncOptions

# Interface: KnexStorageModuleAsyncOptions

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L27)

## Extends

- `Pick`\<`ModuleMetadata`, `"imports"`\>

## Properties

### imports?

> `optional` **imports?**: (`Type`\<`any`\> \| `ForwardReference`\<`any`\> \| `DynamicModule` \| `Promise`\<`DynamicModule`\>)[]

Defined in: ../node\_modules/@nestjs/common/interfaces/modules/module-metadata.interface.d.ts:18

Optional list of imported modules that export the providers which are
required in this module.

#### Inherited from

`Pick.imports`

***

### inject?

> `optional` **inject?**: (`InjectionToken` \| `OptionalFactoryDependency`)[]

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L37)

***

### knexToken

> **knexToken**: `InjectionToken`

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L31)

***

### useClass?

> `optional` **useClass?**: `Type`\<[`KnexStorageOptionsFactory`](KnexStorageOptionsFactory.md)\>

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L33)

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`KnexStorageOptionsFactory`](KnexStorageOptionsFactory.md)\>

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L32)

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`KnexStorageTableOptions`](../../interfaces/KnexStorageTableOptions.md) \| `Promise`\<[`KnexStorageTableOptions`](../../interfaces/KnexStorageTableOptions.md)\>

Defined in: [cap-storage-knex/src/nest/knex-storage.module.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/nest/knex-storage.module.ts#L34)

#### Parameters

##### args

...`unknown`[]

#### Returns

[`KnexStorageTableOptions`](../../interfaces/KnexStorageTableOptions.md) \| `Promise`\<[`KnexStorageTableOptions`](../../interfaces/KnexStorageTableOptions.md)\>
