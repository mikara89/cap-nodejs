[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / MikroReceivedStorage

# Class: MikroReceivedStorage

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L13)

## Implements

- `IReceivedStorage`

## Constructors

### Constructor

> **new MikroReceivedStorage**(`em`, `orm?`): `MikroReceivedStorage`

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L16)

#### Parameters

##### em

`EntityManager`

##### orm?

`MikroORM`\<`IDatabaseDriver`\<`Connection`\>, `EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

#### Returns

`MikroReceivedStorage`

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<`CapReceivedEvent`\<`JsonValue`\> \| `undefined`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:144](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L144)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`CapReceivedEvent`\<`JsonValue`\> \| `undefined`\>

#### Implementation of

`IReceivedStorage.findReceivedById`

***

### getRetryDue()

> **getRetryDue**(`limit`): `Promise`\<`CapReceivedEvent`\<`JsonValue`\>[]\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:127](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L127)

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<`CapReceivedEvent`\<`JsonValue`\>[]\>

#### Implementation of

`IReceivedStorage.getRetryDue`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L21)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createSchema?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IReceivedStorage.initialize`

***

### listReceived()

> **listReceived**(`opts`): `Promise`\<\{ `items`: `CapReceivedEvent`\<`JsonValue`\>[]; `total`: `number`; \}\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:151](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L151)

#### Parameters

##### opts

###### due?

`boolean`

###### limit?

`number`

###### offset?

`number`

###### topic?

`string`

#### Returns

`Promise`\<\{ `items`: `CapReceivedEvent`\<`JsonValue`\>[]; `total`: `number`; \}\>

#### Implementation of

`IReceivedStorage.listReceived`

***

### markProcessed()

> **markProcessed**(`id`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:100](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L100)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IReceivedStorage.markProcessed`

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:110](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L110)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkReceivedFailedOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IReceivedStorage.markReceivedFailed`

***

### trySaveReceived()

> **trySaveReceived**\<`T`\>(`event`): `Promise`\<`TrySaveReceivedResult`\<`T`\>\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:47](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L47)

#### Type Parameters

##### T

`T` *extends* `JsonValue` = `JsonValue`

#### Parameters

##### event

`CapReceivedEvent`\<`T`\>

#### Returns

`Promise`\<`TrySaveReceivedResult`\<`T`\>\>

#### Implementation of

`IReceivedStorage.trySaveReceived`
