[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / MikroPublishStorage

# Class: MikroPublishStorage

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:11](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L11)

MikroORM implementation of IPublishStorage.
Persists outbox events to a relational database.

## Implements

- `IPublishStorage`

## Constructors

### Constructor

> **new MikroPublishStorage**(`em`, `orm?`): `MikroPublishStorage`

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L13)

#### Parameters

##### em

`EntityManager`

##### orm?

`MikroORM`\<`IDatabaseDriver`\<`Connection`\>, `EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

#### Returns

`MikroPublishStorage`

## Methods

### findPublishById()

> **findPublishById**(`id`): `Promise`\<`CapPublishEvent`\<`unknown`\> \| `undefined`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:112](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L112)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`CapPublishEvent`\<`unknown`\> \| `undefined`\>

#### Implementation of

`IPublishStorage.findPublishById`

***

### getUnpublished()

> **getUnpublished**(`limit`): `Promise`\<`CapPublishEvent`\<`unknown`\>[]\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:97](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L97)

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<`CapPublishEvent`\<`unknown`\>[]\>

#### Implementation of

`IPublishStorage.getUnpublished`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L18)

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

> **listPublish**(`opts`): `Promise`\<\{ `items`: `CapPublishEvent`\<`unknown`\>[]; `total`: `number`; \}\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:119](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L119)

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

`Promise`\<\{ `items`: `CapPublishEvent`\<`unknown`\>[]; `total`: `number`; \}\>

#### Implementation of

`IPublishStorage.listPublish`

***

### markPublished()

> **markPublished**(`id`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:89](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L89)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublishStorage.markPublished`

***

### savePublish()

> **savePublish**(`event`): `Promise`\<`string`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:73](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L73)

#### Parameters

##### event

`CapPublishEvent`\<`unknown`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

`IPublishStorage.savePublish`

***

### savePublishWithTx()

> **savePublishWithTx**(`event`, `tx`): `Promise`\<`string`\>

Defined in: [storage-mikro-orm/src/storage/mikro-publish-storage.ts:151](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts#L151)

#### Parameters

##### event

`CapPublishEvent`\<`unknown`\>

##### tx

`unknown`

#### Returns

`Promise`\<`string`\>
