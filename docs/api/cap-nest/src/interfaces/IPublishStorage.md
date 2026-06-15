[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / IPublishStorage

# Interface: IPublishStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:38](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L38)

## Extended by

- [`ITransactionalPublishStorage`](ITransactionalPublishStorage.md)

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:48](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L48)

Atomically claim ready rows for one dispatcher instance.

#### Parameters

##### options

[`ClaimUnpublishedOptions`](ClaimUnpublishedOptions.md)

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

***

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:66](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L66)

Optional: find a published record by id (dashboard helpers)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:45](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L45)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

### listPublish()?

> `optional` **listPublish**(`opts`): `Promise`\<\{ `items`: [`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:69](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L69)

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

`Promise`\<\{ `items`: [`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:53](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L53)

Mark record as successfully emitted to the broker.

#### Parameters

##### id

`string`

##### publishedAt?

`Date`

#### Returns

`Promise`\<`void`\>

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:56](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L56)

Mark record as retryable failed, or dead-letter when retry limit is exceeded.

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkPublishFailedOptions`](MarkPublishFailedOptions.md)

#### Returns

`Promise`\<`void`\>

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:63](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L63)

Release processing rows whose lease has expired.

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

***

### savePublish()

> **savePublish**\<`T`\>(`evt`): `Promise`\<`string`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:40](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L40)

Insert a fresh outbox record and return its DB id

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### evt

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

#### Returns

`Promise`\<`string`\>
