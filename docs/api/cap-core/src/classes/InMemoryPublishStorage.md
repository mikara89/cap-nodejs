[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-core/src](../README.md) / InMemoryPublishStorage

# Class: InMemoryPublishStorage

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:9

## Implements

- [`PublishStoragePort`](../interfaces/PublishStoragePort.md)

## Constructors

### Constructor

> **new InMemoryPublishStorage**(): `InMemoryPublishStorage`

#### Returns

`InMemoryPublishStorage`

## Properties

### store

> `readonly` **store**: `Map`\<`string`, [`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:10

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:19

#### Parameters

##### options

[`ClaimUnpublishedOptions`](../interfaces/ClaimUnpublishedOptions.md)

#### Returns

`Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`claimUnpublished`](../interfaces/PublishStoragePort.md#claimunpublished)

***

### findPublishById()

> **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:77

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`findPublishById`](../interfaces/PublishStoragePort.md#findpublishbyid)

***

### listPublish()

> **listPublish**(`options?`): `Promise`\<\{ `items`: [`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:82

#### Parameters

##### options?

###### limit?

`number`

###### offset?

`number`

###### onlyUnpublished?

`boolean`

###### topic?

`string`

#### Returns

`Promise`\<\{ `items`: [`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`listPublish`](../interfaces/PublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:34

#### Parameters

##### id

`string`

##### publishedAt?

`Date` = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`markPublished`](../interfaces/PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:44

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkPublishFailedOptions`](../interfaces/MarkPublishFailedOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`markPublishFailed`](../interfaces/PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:62

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`releaseExpiredClaims`](../interfaces/PublishStoragePort.md#releaseexpiredclaims)

***

### savePublish()

> **savePublish**\<`T`\>(`event`): `Promise`\<`string`\>

Defined in: cap-core/src/testing/in-memory-publish-storage.ts:12

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<`T`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`savePublish`](../interfaces/PublishStoragePort.md#savepublish)
