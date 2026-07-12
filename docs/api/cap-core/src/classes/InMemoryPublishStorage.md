[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / InMemoryPublishStorage

# Class: InMemoryPublishStorage

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:16](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L16)

## Implements

- [`PublishStoragePort`](../interfaces/PublishStoragePort.md)
- [`CapabilityAwareStoragePort`](../interfaces/CapabilityAwareStoragePort.md)

## Constructors

### Constructor

> **new InMemoryPublishStorage**(): `InMemoryPublishStorage`

#### Returns

`InMemoryPublishStorage`

## Properties

### store

> `readonly` **store**: `Map`\<`string`, [`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L19)

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L42)

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

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:123](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L123)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`findPublishById`](../interfaces/PublishStoragePort.md#findpublishbyid)

***

### getCapabilities()

> **getCapabilities**(): [`CapStorageCapabilities`](../interfaces/CapStorageCapabilities.md)

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L29)

#### Returns

[`CapStorageCapabilities`](../interfaces/CapStorageCapabilities.md)

#### Implementation of

[`CapabilityAwareStoragePort`](../interfaces/CapabilityAwareStoragePort.md).[`getCapabilities`](../interfaces/CapabilityAwareStoragePort.md#getcapabilities)

***

### listPublish()

> **listPublish**(`options?`): `Promise`\<\{ `items`: [`CapPublishEvent`](../interfaces/CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:128](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L128)

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

> **markPublished**(`id`, `publishedAt?`, `ownership?`): `Promise`\<`boolean`\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L57)

#### Parameters

##### id

`string`

##### publishedAt?

`Date` = `...`

##### ownership?

[`PublishClaimOwnership`](../interfaces/PublishClaimOwnership.md) = `{}`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`markPublished`](../interfaces/PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`boolean`\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:74](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L74)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkPublishFailedOptions`](../interfaces/MarkPublishFailedOptions.md)

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`markPublishFailed`](../interfaces/PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:108](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L108)

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`releaseExpiredClaims`](../interfaces/PublishStoragePort.md#releaseexpiredclaims)

***

### renewPublishClaim()

> **renewPublishClaim**(`options`): `Promise`\<`boolean`\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:94](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L94)

#### Parameters

##### options

[`RenewPublishClaimOptions`](../interfaces/RenewPublishClaimOptions.md)

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`PublishStoragePort`](../interfaces/PublishStoragePort.md).[`renewPublishClaim`](../interfaces/PublishStoragePort.md#renewpublishclaim)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `_ctx?`): `Promise`\<`string`\>

Defined in: [cap-core/src/testing/in-memory-publish-storage.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-publish-storage.ts#L21)

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
