[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapModule

# Class: CapModule

Defined in: cap-nest/src/cap/cap.module.ts:64

## Constructors

### Constructor

> **new CapModule**(): `CapModule`

#### Returns

`CapModule`

## Methods

### forInMemory()

> `static` **forInMemory**(`options?`): `DynamicModule`

Defined in: cap-nest/src/cap/cap.module.ts:123

#### Parameters

##### options?

`Omit`\<[`CapModuleOptions`](../interfaces/CapModuleOptions.md), `"imports"`\> = `{}`

#### Returns

`DynamicModule`

***

### forRoot()

> `static` **forRoot**(`opts?`): `DynamicModule`

Defined in: cap-nest/src/cap/cap.module.ts:65

#### Parameters

##### opts?

[`CapModuleOptions`](../interfaces/CapModuleOptions.md) = `{}`

#### Returns

`DynamicModule`

***

### forRootAsync()

> `static` **forRootAsync**(`opts`): `DynamicModule`

Defined in: cap-nest/src/cap/cap.module.ts:96

#### Parameters

##### opts

[`CapModuleAsyncOptions`](../interfaces/CapModuleAsyncOptions.md)

#### Returns

`DynamicModule`
