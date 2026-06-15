[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapModule

# Class: CapModule

Defined in: [cap-nest/src/cap/cap.module.ts:63](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L63)

## Constructors

### Constructor

> **new CapModule**(): `CapModule`

#### Returns

`CapModule`

## Methods

### forInMemory()

> `static` **forInMemory**(`options?`): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:116](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L116)

#### Parameters

##### options?

`Omit`\<[`CapModuleOptions`](../interfaces/CapModuleOptions.md), `"imports"`\> = `{}`

#### Returns

`DynamicModule`

***

### forRoot()

> `static` **forRoot**(`opts?`): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:64](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L64)

#### Parameters

##### opts?

[`CapModuleOptions`](../interfaces/CapModuleOptions.md) = `{}`

#### Returns

`DynamicModule`

***

### forRootAsync()

> `static` **forRootAsync**(`opts`): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:92](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L92)

#### Parameters

##### opts

[`CapModuleAsyncOptions`](../interfaces/CapModuleAsyncOptions.md)

#### Returns

`DynamicModule`
