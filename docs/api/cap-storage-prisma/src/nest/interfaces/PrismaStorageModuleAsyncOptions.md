[**CAP Node.js API**](../../../../README.md)

***

[CAP Node.js API](../../../../README.md) / [cap-storage-prisma/src/nest](../README.md) / PrismaStorageModuleAsyncOptions

# Interface: PrismaStorageModuleAsyncOptions

Defined in: cap-storage-prisma/src/nest/prisma-storage.module.ts:29

## Extends

- `Pick`\<`ModuleMetadata`, `"imports"`\>

## Properties

### clientToken

> **clientToken**: `InjectionToken`

Defined in: cap-storage-prisma/src/nest/prisma-storage.module.ts:33

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

Defined in: cap-storage-prisma/src/nest/prisma-storage.module.ts:39

***

### useClass?

> `optional` **useClass?**: `Type`\<[`PrismaStorageOptionsFactory`](PrismaStorageOptionsFactory.md)\>

Defined in: cap-storage-prisma/src/nest/prisma-storage.module.ts:35

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`PrismaStorageOptionsFactory`](PrismaStorageOptionsFactory.md)\>

Defined in: cap-storage-prisma/src/nest/prisma-storage.module.ts:34

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`PrismaStorageOptions`](../../interfaces/PrismaStorageOptions.md) \| `Promise`\<[`PrismaStorageOptions`](../../interfaces/PrismaStorageOptions.md)\>

Defined in: cap-storage-prisma/src/nest/prisma-storage.module.ts:36

#### Parameters

##### args

...`unknown`[]

#### Returns

[`PrismaStorageOptions`](../../interfaces/PrismaStorageOptions.md) \| `Promise`\<[`PrismaStorageOptions`](../../interfaces/PrismaStorageOptions.md)\>
