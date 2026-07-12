[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / TransactionalPublishStoragePort

# Interface: TransactionalPublishStoragePort\<TTx\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:39

## Extends

- [`PublishStoragePort`](PublishStoragePort.md)\<`TTx`\>

## Type Parameters

### TTx

`TTx` = `unknown`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:31

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

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:36

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

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:30

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

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:37

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`listPublish`](PublishStoragePort.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`, `ownership?`): `Promise`\<`boolean` \| `void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:32

#### Parameters

##### id

`string`

##### publishedAt?

`Date`

##### ownership?

`PublishClaimOwnership`

#### Returns

`Promise`\<`boolean` \| `void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`markPublished`](PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`boolean` \| `void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:33

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkPublishFailedOptions`

#### Returns

`Promise`\<`boolean` \| `void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`markPublishFailed`](PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:35

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`releaseExpiredClaims`](PublishStoragePort.md#releaseexpiredclaims)

***

### renewPublishClaim()?

> `optional` **renewPublishClaim**(`options`): `Promise`\<`boolean`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:34

#### Parameters

##### options

`RenewPublishClaimOptions`

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`renewPublishClaim`](PublishStoragePort.md#renewpublishclaim)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:29

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

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:40

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
