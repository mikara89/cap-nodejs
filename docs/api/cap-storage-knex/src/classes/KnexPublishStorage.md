[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-knex/src](../README.md) / KnexPublishStorage

# Class: KnexPublishStorage

Defined in: cap-storage-knex/src/knex-publish-storage.ts:46

## Implements

- [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`Knex.Transaction`\>
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new KnexPublishStorage**(`knex`, `options?`): `KnexPublishStorage`

Defined in: cap-storage-knex/src/knex-publish-storage.ts:51

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

Defined in: cap-storage-knex/src/knex-publish-storage.ts:86

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

Defined in: cap-storage-knex/src/knex-publish-storage.ts:181

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

Defined in: cap-storage-knex/src/knex-publish-storage.ts:82

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### initialize()

> **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-publish-storage.ts:58

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

Defined in: cap-storage-knex/src/knex-publish-storage.ts:190

#### Parameters

##### options?

[`DashboardListOptions`](../../../cap-nest/src/interfaces/DashboardListOptions.md) = `{}`

#### Returns

`Promise`\<[`DashboardListResult`](../../../cap-nest/src/interfaces/DashboardListResult.md)\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>\>\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`listPublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-publish-storage.ts:127

#### Parameters

##### id

`string`

##### publishedAt?

`Date` = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`markPublished`](../../../cap-nest/src/interfaces/PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-publish-storage.ts:141

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

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`markPublishFailed`](../../../cap-nest/src/interfaces/PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-publish-storage.ts:169

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`releaseExpiredClaims`](../../../cap-nest/src/interfaces/PublishStoragePort.md#releaseexpiredclaims)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: cap-storage-knex/src/knex-publish-storage.ts:63

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

Defined in: cap-storage-knex/src/knex-publish-storage.ts:75

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
