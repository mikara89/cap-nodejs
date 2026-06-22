[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / MikroPublishStorage

# Class: MikroPublishStorage

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:34

## Implements

- [`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md)

## Constructors

### Constructor

> **new MikroPublishStorage**(`em`, `orm?`, `logger?`): `MikroPublishStorage`

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:35

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

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:83

#### Parameters

##### options

`ClaimUnpublishedOptions`

#### Returns

`Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`claimUnpublished`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#claimunpublished)

***

### findPublishById()

> **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:152

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`findPublishById`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#findpublishbyid)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:41

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createSchema?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`initialize`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#initialize)

***

### listPublish()

> **listPublish**(`opts`): `Promise`\<\{ `items`: [`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:159

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

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`listPublish`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:105

#### Parameters

##### id

`string`

##### publishedAt?

`Date` = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`markPublished`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:116

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

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`markPublishFailed`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:136

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`releaseExpiredClaims`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#releaseexpiredclaims)

***

### savePublish()

> **savePublish**(`event`): `Promise`\<`string`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:67

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`savePublish`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#savepublish)

***

### savePublishWithTx()

> **savePublishWithTx**(`event`, `tx`): `Promise`\<`string`\>

Defined in: cap-storage-mikro-orm/src/storage/mikro-publish-storage.ts:73

#### Parameters

##### event

[`CapPublishEvent`](../../../cap-nest/src/interfaces/CapPublishEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>

##### tx

`unknown`

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`TransactionalPublishStoragePort`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md).[`savePublishWithTx`](../../../cap-nest/src/interfaces/TransactionalPublishStoragePort.md#savepublishwithtx)
