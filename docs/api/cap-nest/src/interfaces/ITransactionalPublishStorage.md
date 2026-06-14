[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / ITransactionalPublishStorage

# Interface: ITransactionalPublishStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:45](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L45)

Optional interface for storages that can persist an outbox record
inside an existing transaction/context. Adapters that support
transactions (e.g. MikroORM) can implement this to opt-in.

## Extends

- [`IPublishStorage`](IPublishStorage.md)

## Methods

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<`unknown`\> \| `undefined`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:26](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L26)

Optional: find a published record by id (dashboard helpers)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<`unknown`\> \| `undefined`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`findPublishById`](IPublishStorage.md#findpublishbyid)

***

### getUnpublished()

> **getUnpublished**(`limit`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<`unknown`\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:23](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L23)

Fetch N unpublished rows – used by retry-scheduler

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<`unknown`\>[]\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`getUnpublished`](IPublishStorage.md#getunpublished)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:17](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L17)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`initialize`](IPublishStorage.md#initialize)

***

### listPublish()?

> `optional` **listPublish**(`opts`): `Promise`\<\{ `items`: [`CapPublishEvent`](CapPublishEvent.md)\<`unknown`\>[]; `total?`: `number`; \}\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:29](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L29)

Optional: paginated listing for dashboards and admin UIs

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

`Promise`\<\{ `items`: [`CapPublishEvent`](CapPublishEvent.md)\<`unknown`\>[]; `total?`: `number`; \}\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`listPublish`](IPublishStorage.md#listpublish)

***

### markPublished()

> **markPublished**(`id`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:20](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L20)

Mark record as successfully emitted to the broker

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`markPublished`](IPublishStorage.md#markpublished)

***

### savePublish()

> **savePublish**\<`T`\>(`evt`): `Promise`\<`string`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:14](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L14)

Insert a fresh record and return its DB id

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### evt

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

#### Returns

`Promise`\<`string`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`savePublish`](IPublishStorage.md#savepublish)

***

### savePublishWithTx()

> **savePublishWithTx**\<`T`\>(`evt`, `tx`): `Promise`\<`string`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:46](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L46)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### evt

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

##### tx

`unknown`

#### Returns

`Promise`\<`string`\>
