[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / TransactionalPublishStoragePort

# Interface: TransactionalPublishStoragePort\<TTx\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:72](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L72)

## Extends

- [`PublishStoragePort`](PublishStoragePort.md)\<`TTx`\>

## Type Parameters

### TTx

`TTx` = `unknown`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:45](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L45)

#### Parameters

##### options

[`ClaimUnpublishedOptions`](ClaimUnpublishedOptions.md)

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`claimUnpublished`](PublishStoragePort.md#claimunpublished)

***

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:65](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L65)

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

Defined in: [cap-core/src/ports/publish-storage.port.ts:43](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L43)

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`initialize`](PublishStoragePort.md#initialize)

***

### listPublish()?

> `optional` **listPublish**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:67](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L67)

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

Defined in: [cap-core/src/ports/publish-storage.port.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L49)

#### Parameters

##### id

`string`

##### publishedAt?

`Date`

##### ownership?

[`PublishClaimOwnership`](PublishClaimOwnership.md)

#### Returns

`Promise`\<`boolean` \| `void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`markPublished`](PublishStoragePort.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`boolean` \| `void`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:55](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L55)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkPublishFailedOptions`](MarkPublishFailedOptions.md)

#### Returns

`Promise`\<`boolean` \| `void`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`markPublishFailed`](PublishStoragePort.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:63](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L63)

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

Defined in: [cap-core/src/ports/publish-storage.port.ts:61](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L61)

#### Parameters

##### options

[`RenewPublishClaimOptions`](RenewPublishClaimOptions.md)

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

[`PublishStoragePort`](PublishStoragePort.md).[`renewPublishClaim`](PublishStoragePort.md#renewpublishclaim)

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:38](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L38)

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

### ~~savePublishWithTx()~~

> **savePublishWithTx**\<`T`\>(`event`, `tx`): `Promise`\<`string`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:78](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L78)

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

#### Deprecated

Use savePublish(event, { tx }) instead.
