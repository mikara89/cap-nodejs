[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / IPublishStorage

# Interface: IPublishStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:12](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L12)

## Extended by

- [`ITransactionalPublishStorage`](ITransactionalPublishStorage.md)

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
