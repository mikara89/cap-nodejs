[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / InMemoryPublishStorage

# Class: InMemoryPublishStorage

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:10](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L10)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L11)

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L21)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:79](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L79)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:84](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L84)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:36](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L36)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:46](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L46)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:64](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L64)

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`releaseExpiredClaims`](../interfaces/PublishStoragePort.md#releaseexpiredclaims)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `_ctx?`): `Promise`\<`string`\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:13](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L13)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<`T`\>

##### \_ctx?

[`CapOperationContext`](../interfaces/CapOperationContext.md)\<`unknown`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`savePublish`](../interfaces/PublishStoragePort.md#savepublish)
