[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / MikroPublishStorage

# Class: MikroPublishStorage

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:42

## Implements

- [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)\<`EntityManager`\>
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new MikroPublishStorage**(`em`, `orm?`, `logger?`): `MikroPublishStorage`

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:45

#### Parameters

##### em

`EntityManager`

##### orm?

`MikroORM`\<`IDatabaseDriver`\<`Connection`\>, `EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

##### logger?

[`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

#### Returns

`MikroPublishStorage`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:101

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

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:170

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

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:97

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:51

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createSchema?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`initialize`](../../../cap-nest/src/interfaces/PublishStoragePort.md#initialize)

***

### listPublish()

> **listPublish**(`opts`): `Promise`\<\{ `items`: [`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:177

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

`Promise`\<\{ `items`: [`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`listPublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:123

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

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:134

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

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:154

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`releaseExpiredClaims`](../../../cap-nest/src/interfaces/PublishStoragePort.md#releaseexpiredclaims)

***

### savePublish()

> **savePublish**(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:77

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>

##### ctx?

[`CapOperationContext`](../../../cap-nest/src/interfaces/CapOperationContext.md)\<`EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md).[`savePublish`](../../../cap-nest/src/interfaces/PublishStoragePort.md#savepublish)

***

### ~~savePublishWithTx()~~

> **savePublishWithTx**(`event`, `tx`): `Promise`\<`string`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:90

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>

##### tx

`EntityManager`

#### Returns

`Promise`\<`string`\>

#### Deprecated

Use savePublish(event, { tx }) instead.
