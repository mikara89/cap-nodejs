[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / MikroPublishStorage

# Class: MikroPublishStorage

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:34](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L34)

## Implements

- `IPublishStorage`

## Constructors

### Constructor

> **new MikroPublishStorage**(`em`, `orm?`): `MikroPublishStorage`

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:37](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L37)

#### Parameters

##### em

`EntityManager`

##### orm?

`MikroORM`\<`IDatabaseDriver`\<`Connection`\>, `EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

#### Returns

`MikroPublishStorage`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<`CapPublishEvent`\<`JsonValue`\>[]\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:84](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L84)

#### Parameters

##### options

`ClaimUnpublishedOptions`

#### Returns

`Promise`\<`CapPublishEvent`\<`JsonValue`\>[]\>

#### Implementation of

`IPublishStorage.claimUnpublished`

***

### findPublishById()

> **findPublishById**(`id`): `Promise`\<`CapPublishEvent`\<`JsonValue`\> \| `undefined`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:153](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L153)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`CapPublishEvent`\<`JsonValue`\> \| `undefined`\>

#### Implementation of

`IPublishStorage.findPublishById`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:42](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L42)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createSchema?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublishStorage.initialize`

***

### listPublish()

> **listPublish**(`opts`): `Promise`\<\{ `items`: `CapPublishEvent`\<`JsonValue`\>[]; `total`: `number`; \}\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:160](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L160)

#### Parameters

##### opts

###### limit?

`number`

###### offset?

`number`

###### onlyUnpublished?

`boolean`

###### topic?

`string`

#### Returns

`Promise`\<\{ `items`: `CapPublishEvent`\<`JsonValue`\>[]; `total`: `number`; \}\>

#### Implementation of

`IPublishStorage.listPublish`

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:106](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L106)

#### Parameters

##### id

`string`

##### publishedAt?

`Date` = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublishStorage.markPublished`

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:117](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L117)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkPublishFailedOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublishStorage.markPublishFailed`

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:137](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L137)

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublishStorage.releaseExpiredClaims`

***

### savePublish()

> **savePublish**(`event`): `Promise`\<`string`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:68](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L68)

#### Parameters

##### event

`CapPublishEvent`\<`JsonValue`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

`IPublishStorage.savePublish`

***

### savePublishWithTx()

> **savePublishWithTx**(`event`, `tx`): `Promise`\<`string`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:74](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L74)

#### Parameters

##### event

`CapPublishEvent`\<`JsonValue`\>

##### tx

`unknown`

#### Returns

`Promise`\<`string`\>
