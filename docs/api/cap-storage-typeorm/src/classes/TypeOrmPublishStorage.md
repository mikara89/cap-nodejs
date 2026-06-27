[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-typeorm/src](../README.md) / TypeOrmPublishStorage

# Class: TypeOrmPublishStorage

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L49)

## Implements

- [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`EntityManager`\>
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new TypeOrmPublishStorage**(`dataSource`, `options?`): `TypeOrmPublishStorage`

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:54](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L54)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:96](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L96)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:211](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L211)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:92](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L92)

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### initialize()

> **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:61](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L61)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:218](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L218)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:151](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L151)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:167](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L167)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:196](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L196)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:68](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L68)

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

Defined in: [cap-storage-typeorm/src/typeorm-publish-storage.ts:85](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-typeorm/src/typeorm-publish-storage.ts#L85)

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
