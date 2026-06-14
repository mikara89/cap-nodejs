[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapModule

# Class: CapModule

Defined in: [cap-nest/src/cap/cap.module.ts:91](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L91)

## Constructors

### Constructor

> **new CapModule**(): `CapModule`

#### Returns

`CapModule`

## Methods

### forAdapters()

> `static` **forAdapters**(`storageModule`, `transportModule`, `init?`): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:141](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L141)

#### Parameters

##### storageModule

[`CapAdapterModule`](../interfaces/CapAdapterModule.md)

##### transportModule

[`CapAdapterModule`](../interfaces/CapAdapterModule.md)

##### init?

[`InitOptions`](../interfaces/InitOptions.md)

optional init options forwarded to forRoot()

#### Returns

`DynamicModule`

***

### forInMemory()

> `static` **forInMemory**(): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:158](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L158)

#### Returns

`DynamicModule`

***

### forRoot()

> `static` **forRoot**(`opts`): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:95](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L95)

#### Parameters

##### opts

[`CapModuleOptions`](../interfaces/CapModuleOptions.md)

#### Returns

`DynamicModule`

***

### forRootAsync()

> `static` **forRootAsync**(`opts`): `DynamicModule`

Defined in: [cap-nest/src/cap/cap.module.ts:320](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L320)

#### Parameters

##### opts

[`CapModuleAsyncOptions`](../interfaces/CapModuleAsyncOptions.md)

#### Returns

`DynamicModule`
