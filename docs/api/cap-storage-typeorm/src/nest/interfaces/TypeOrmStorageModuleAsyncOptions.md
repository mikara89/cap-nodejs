[**CAP Node.js API**](../../../../README.md)

***

[CAP Node.js API](../../../../README.md) / [cap-storage-typeorm/src/nest](../README.md) / TypeOrmStorageModuleAsyncOptions

# Interface: TypeOrmStorageModuleAsyncOptions

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L30)

## Extends

- `Pick`\<`ModuleMetadata`, `"imports"`\>

## Properties

### dataSource?

> `optional` **dataSource?**: `string` \| `DataSource`

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L34)

***

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

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:40](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L40)

***

### useClass?

> `optional` **useClass?**: `Type`\<[`TypeOrmStorageOptionsFactory`](TypeOrmStorageOptionsFactory.md)\>

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:36](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L36)

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`TypeOrmStorageOptionsFactory`](TypeOrmStorageOptionsFactory.md)\>

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:35](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L35)

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`TypeOrmStorageTableOptions`](../../interfaces/TypeOrmStorageTableOptions.md) \| `Promise`\<[`TypeOrmStorageTableOptions`](../../interfaces/TypeOrmStorageTableOptions.md)\>

Defined in: [cap-storage-typeorm/src/nest/typeorm-storage.module.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/nest/typeorm-storage.module.ts#L37)

#### Parameters

##### args

...`unknown`[]

#### Returns

[`TypeOrmStorageTableOptions`](../../interfaces/TypeOrmStorageTableOptions.md) \| `Promise`\<[`TypeOrmStorageTableOptions`](../../interfaces/TypeOrmStorageTableOptions.md)\>
