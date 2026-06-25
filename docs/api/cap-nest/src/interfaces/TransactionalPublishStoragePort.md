[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / TransactionalPublishStoragePort

# Interface: TransactionalPublishStoragePort\<TTx\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:28

## Extends

- [`PublishStoragePort`](PublishStoragePort.md)\<`TTx`\>

## Type Parameters

### TTx

`TTx` = `unknown`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:21

#### Parameters

##### options

`ClaimUnpublishedOptions`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`claimUnpublished`](PublishStoragePort.md#claimunpublished)

***

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:25

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`findPublishById`](PublishStoragePort.md#findpublishbyid)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:20

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`initialize`](PublishStoragePort.md#initialize)

***

### listPublish()?

> `optional` **listPublish**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:26

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`listPublish`](PublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:22

#### Parameters

##### id

`string`

##### publishedAt?

`Date`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`markPublished`](PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:23

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkPublishFailedOptions`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`markPublishFailed`](PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:24

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`releaseExpiredClaims`](PublishStoragePort.md#releaseexpiredclaims)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:19

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

##### ctx?

[`CapOperationContext`](CapOperationContext.md)\<`TTx`\>

#### Returns

`Promise`\<`string`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`savePublish`](PublishStoragePort.md#savepublish)

***

### savePublishWithTx()

> **savePublishWithTx**\<`T`\>(`event`, `tx`): `Promise`\<`string`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:29

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

##### tx

`TTx`

#### Returns

`Promise`\<`string`\>
