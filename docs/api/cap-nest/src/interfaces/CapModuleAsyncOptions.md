[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapModuleAsyncOptions

# Interface: CapModuleAsyncOptions

Defined in: [cap-nest/src/cap/cap.module.ts:79](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L79)

## Properties

### imports?

> `optional` **imports?**: `DynamicModule`[]

Defined in: [cap-nest/src/cap/cap.module.ts:80](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L80)

***

### inject?

> `optional` **inject?**: (`InjectionToken` \| `OptionalFactoryDependency`)[]

Defined in: [cap-nest/src/cap/cap.module.ts:86](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L86)

***

### useClass?

> `optional` **useClass?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:82](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L82)

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:81](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L81)

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`CapAsyncProviders`](CapAsyncProviders.md) \| `Promise`\<[`CapAsyncProviders`](CapAsyncProviders.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:83](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L83)

#### Parameters

##### args

...`unknown`[]

#### Returns

[`CapAsyncProviders`](CapAsyncProviders.md) \| `Promise`\<[`CapAsyncProviders`](CapAsyncProviders.md)\>
