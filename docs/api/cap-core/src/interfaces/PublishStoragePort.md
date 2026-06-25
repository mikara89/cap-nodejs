[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / PublishStoragePort

# Interface: PublishStoragePort\<TTx\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:25](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L25)

## Extended by

- [`TransactionalPublishStoragePort`](TransactionalPublishStoragePort.md)

## Type Parameters

### TTx

`TTx` = `unknown`

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L33)

#### Parameters

##### options

[`ClaimUnpublishedOptions`](ClaimUnpublishedOptions.md)

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

***

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:47](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L47)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L31)

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

### listPublish()?

> `optional` **listPublish**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L49)

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L37)

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

Defined in: [cap-core/src/ports/publish-storage.port.ts:39](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L39)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkPublishFailedOptions`](MarkPublishFailedOptions.md)

#### Returns

`Promise`\<`void`\>

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:45](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L45)

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

***

### savePublish()

> **savePublish**\<`T`\>(`event`, `ctx?`): `Promise`\<`string`\>

Defined in: [cap-core/src/ports/publish-storage.port.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publish-storage.port.ts#L26)

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
