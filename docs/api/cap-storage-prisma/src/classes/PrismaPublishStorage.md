[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-prisma/src](../README.md) / PrismaPublishStorage

# Class: PrismaPublishStorage

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:71](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L71)

## Implements

- [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`Prisma.TransactionClient`\>
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new PrismaPublishStorage**(`client`, `options`): `PrismaPublishStorage`

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:78](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L78)

#### Parameters

##### client

[`PrismaCapClient`](../interfaces/PrismaCapClient.md)

##### options

[`PrismaStorageOptions`](../interfaces/PrismaStorageOptions.md)

#### Returns

`PrismaPublishStorage`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:119](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L119)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:312](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L312)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:115](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L115)

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### initialize()

> **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:85](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L85)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:319](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L319)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:186](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L186)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:219](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L219)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:293](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L293)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:267](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L267)

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

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:90](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L90)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<`T`\>

##### ctx?

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`TransactionClient`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`savePublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#savepublish)

***

### ~~savePublishWithTx()~~

> **savePublishWithTx**\<`T`\>(`event`, `tx`): `Promise`\<`string`\>

Defined in: [cap-storage-prisma/src/prisma-publish-storage.ts:108](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-prisma/src/prisma-publish-storage.ts#L108)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<`T`\>

##### tx

`Prisma.TransactionClient`

#### Returns

`Promise`\<`string`\>

#### Deprecated

Use savePublish(event, { tx }) instead.
