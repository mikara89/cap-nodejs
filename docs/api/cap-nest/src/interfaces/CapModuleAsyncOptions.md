[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapModuleAsyncOptions

# Interface: CapModuleAsyncOptions

Defined in: [cap-nest/src/cap/cap.module.ts:48](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L48)

## Properties

### imports?

> `optional` **imports?**: (`Type`\<`any`\> \| `ForwardReference`\<`any`\> \| `DynamicModule` \| `Promise`\<`DynamicModule`\>)[]

Defined in: [cap-nest/src/cap/cap.module.ts:49](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L49)

***

### inject?

> `optional` **inject?**: (`InjectionToken` \| `OptionalFactoryDependency`)[]

Defined in: [cap-nest/src/cap/cap.module.ts:55](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L55)

***

### useClass?

> `optional` **useClass?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:51](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L51)

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:50](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L50)

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`CapModuleOptions`](CapModuleOptions.md) \| `Promise`\<[`CapModuleOptions`](CapModuleOptions.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:52](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L52)

#### Parameters

##### args

...`unknown`[]

#### Returns

[`CapModuleOptions`](CapModuleOptions.md) \| `Promise`\<[`CapModuleOptions`](CapModuleOptions.md)\>
