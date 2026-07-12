[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-knex/src](../README.md) / KnexPublishStorage

# Class: KnexPublishStorage

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L49)

## Implements

- [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`Knex.Transaction`\>
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new KnexPublishStorage**(`knex`, `options?`): `KnexPublishStorage`

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:54](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L54)

#### Parameters

##### knex

`Knex`

##### options?

[`KnexStorageTableOptions`](../interfaces/KnexStorageTableOptions.md) = `{}`

#### Returns

`KnexPublishStorage`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:89](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L89)

#### Parameters

##### options

`ClaimUnpublishedOptions`

#### Returns

`Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`claimUnpublished`](../../../cap-nest/src/interfaces/PublishStoragePort.md#claimunpublished)

***

### findPublishById()

> **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:207](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L207)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`findPublishById`](../../../cap-nest/src/interfaces/PublishStoragePort.md#findpublishbyid)

***

### getCapabilities()

> **getCapabilities**(): `CapStorageCapabilities`

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:85](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L85)

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### initialize()

> **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:61](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L61)

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`initialize`](../../../cap-nest/src/interfaces/PublishStoragePort.md#initialize)

***

### listPublish()

> **listPublish**(`options?`): `Promise`\<[`DashboardListResult`](../../../cap-nest/src/interfaces/DashboardListResult.md)\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>\>\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:216](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L216)

#### Parameters

##### options?

[`DashboardListOptions`](../../../cap-nest/src/interfaces/DashboardListOptions.md) = `{}`

#### Returns

`Promise`\<[`DashboardListResult`](../../../cap-nest/src/interfaces/DashboardListResult.md)\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>\>\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`listPublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`, `ownership?`): `Promise`\<`boolean`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:130](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L130)

#### Parameters

##### id

`string`

##### publishedAt?

`Date` = `...`

##### ownership?

`PublishClaimOwnership` = `{}`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`markPublished`](../../../cap-nest/src/interfaces/PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`boolean`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:149](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L149)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkPublishFailedOptions`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`markPublishFailed`](../../../cap-nest/src/interfaces/PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:195](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L195)

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`releaseExpiredClaims`](../../../cap-nest/src/interfaces/PublishStoragePort.md#releaseexpiredclaims)

***

### renewPublishClaim()

> **renewPublishClaim**(`options`): `Promise`\<`boolean`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:180](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L180)

#### Parameters

##### options

`RenewPublishClaimOptions`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`renewPublishClaim`](../../../cap-nest/src/interfaces/PublishStoragePort.md#renewpublishclaim)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:66](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L66)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<`T`\>

##### ctx?

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`Transaction`\<`any`, `any`[]\>\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`savePublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#savepublish)

***

### ~~savePublishWithTx()~~

> **savePublishWithTx**\<`T`\>(`event`, `tx`): `Promise`\<`string`\>

Defined in: [cap-storage-knex/src/knex-publish-storage.ts:78](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-knex/src/knex-publish-storage.ts#L78)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<`T`\>

##### tx

`Transaction`

#### Returns

`Promise`\<`string`\>

#### Deprecated

Use savePublish(event, { tx }) instead.
