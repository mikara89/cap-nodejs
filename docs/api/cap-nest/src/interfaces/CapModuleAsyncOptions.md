[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapModuleAsyncOptions

# Interface: CapModuleAsyncOptions

Defined in: cap-nest/src/cap/cap.module.ts:49

## Properties

### imports?

> `optional` **imports?**: (`Type`\<`any`\> \| `ForwardReference`\<`any`\> \| `DynamicModule` \| `Promise`\<`DynamicModule`\>)[]

Defined in: cap-nest/src/cap/cap.module.ts:50

***

### inject?

> `optional` **inject?**: (`InjectionToken` \| `OptionalFactoryDependency`)[]

Defined in: cap-nest/src/cap/cap.module.ts:56

***

### useClass?

> `optional` **useClass?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: cap-nest/src/cap/cap.module.ts:52

***

### useExisting?

> `optional` **useExisting?**: `Type`\<[`CapModuleFactory`](CapModuleFactory.md)\>

Defined in: cap-nest/src/cap/cap.module.ts:51

***

### useFactory?

> `optional` **useFactory?**: (...`args`) => [`CapModuleOptions`](CapModuleOptions.md) \| `Promise`\<[`CapModuleOptions`](CapModuleOptions.md)\>

Defined in: cap-nest/src/cap/cap.module.ts:53

#### Parameters

##### args

...`unknown`[]

#### Returns

[`CapModuleOptions`](CapModuleOptions.md) \| `Promise`\<[`CapModuleOptions`](CapModuleOptions.md)\>
