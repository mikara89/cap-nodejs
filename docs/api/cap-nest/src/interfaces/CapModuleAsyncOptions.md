[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapModuleAsyncOptions

# Interface: CapModuleAsyncOptions

Defined in: [cap-nest/src/cap/cap.module.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L49)

## Properties

### imports?

> `optional` **imports?**: (`Type`\<`any`\> \| `ForwardReference`\<`any`\> \| `DynamicModule` \| `Promise`\<`DynamicModule`\>)[]

Defined in: [cap-nest/src/cap/cap.module.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L50)

***

### inject?

> `optional` **inject?**: (`InjectionToken` \| `OptionalFactoryDependency`)[]

Defined in: [cap-nest/src/cap/cap.module.ts:56](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L56)

***

### useClass?

> `optional` **useClass?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:52](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L52)

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:51](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L51)

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`CapModuleOptions`](CapModuleOptions.md) \| `Promise`\<[`CapModuleOptions`](CapModuleOptions.md)\>

Defined in: [cap-nest/src/cap/cap.module.ts:53](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L53)

#### Parameters

##### args

...`unknown`[]

#### Returns

[`CapModuleOptions`](CapModuleOptions.md) \| `Promise`\<[`CapModuleOptions`](CapModuleOptions.md)\>
