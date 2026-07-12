[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-typeorm/src](../README.md) / TypeOrmPublishStorage

# Class: TypeOrmPublishStorage

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:52](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L52)

## Implements

- [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`EntityManager`\>
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new TypeOrmPublishStorage**(`dataSource`, `options?`): `TypeOrmPublishStorage`

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L57)

#### Parameters

##### dataSource

`DataSource`

##### options?

[`TypeOrmStorageTableOptions`](../interfaces/TypeOrmStorageTableOptions.md) = `{}`

#### Returns

`TypeOrmPublishStorage`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:99](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L99)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:255](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L255)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:95](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L95)

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### initialize()

> **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:64](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L64)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:262](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L262)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:154](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L154)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:182](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L182)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:240](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L240)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:222](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L222)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:71](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L71)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<`T`\>

##### ctx?

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`EntityManager`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`savePublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#savepublish)

***

### ~~savePublishWithTx()~~

> **savePublishWithTx**\<`T`\>(`event`, `tx`): `Promise`\<`string`\>

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:88](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L88)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<`T`\>

##### tx

`EntityManager`

#### Returns

`Promise`\<`string`\>

#### Deprecated

Use savePublish(event, { tx }) instead.
