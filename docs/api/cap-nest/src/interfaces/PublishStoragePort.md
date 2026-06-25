[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / PublishStoragePort

# Interface: PublishStoragePort\<TTx\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:18

## Extended by

- [`TransactionalPublishStoragePort`](TransactionalPublishStoragePort.md)

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

***

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:25

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:20

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

***

### listPublish()?

> `optional` **listPublish**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:26

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

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

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publish-storage.port.d.ts:24

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

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
