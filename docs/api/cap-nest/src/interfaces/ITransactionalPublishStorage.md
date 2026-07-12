[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / ITransactionalPublishStorage

# Interface: ITransactionalPublishStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:105](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L105)

## Extends

- [`IPublishStorage`](IPublishStorage.md)

## Methods

### claimUnpublished()

> **claimUnpublished**(`options`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:66](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L66)

Atomically claim ready rows for one dispatcher instance.

#### Parameters

##### options

[`ClaimUnpublishedOptions`](ClaimUnpublishedOptions.md)

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`claimUnpublished`](IPublishStorage.md#claimunpublished)

***

### findPublishById()?

> `optional` **findPublishById**(`id`): `Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:91](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L91)

Optional: find a published record by id (dashboard helpers)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`findPublishById`](IPublishStorage.md#findpublishbyid)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:63](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L63)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`initialize`](IPublishStorage.md#initialize)

***

### listPublish()?

> `optional` **listPublish**(`opts`): `Promise`\<\{ `items`: [`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:94](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L94)

Optional: paginated listing for dashboards and admin UIs

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

`Promise`\<\{ `items`: [`CapPublishEvent`](CapPublishEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`listPublish`](IPublishStorage.md#listpublish)

***

### markPublished()

> **markPublished**(`id`, `publishedAt?`, `ownership?`): `Promise`\<`boolean` \| `void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:71](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L71)

Mark record as successfully emitted to the broker.

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

[`IPublishStorage`](IPublishStorage.md).[`markPublished`](IPublishStorage.md#markpublished)

***

### markPublishFailed()

> **markPublishFailed**(`id`, `error`, `options`): `Promise`\<`boolean` \| `void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:78](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L78)

Mark record as retryable failed, or dead-letter when retry limit is exceeded.

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

[`IPublishStorage`](IPublishStorage.md).[`markPublishFailed`](IPublishStorage.md#markpublishfailed)

***

### releaseExpiredClaims()

> **releaseExpiredClaims**(`now`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:88](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L88)

Release processing rows whose lease has expired.

#### Parameters

##### now

`Date`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`releaseExpiredClaims`](IPublishStorage.md#releaseexpiredclaims)

***

### renewPublishClaim()?

> `optional` **renewPublishClaim**(`options`): `Promise`\<`boolean`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:85](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L85)

Optional: extend an unexpired claim still owned by the expected token.

#### Parameters

##### options

[`RenewPublishClaimOptions`](RenewPublishClaimOptions.md)

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`renewPublishClaim`](IPublishStorage.md#renewpublishclaim)

***

### savePublish()

> **savePublish**\<`T`\>(`evt`, `ctx?`): `Promise`\<`string`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L57)

Insert a fresh outbox record and return its DB id

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### evt

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

##### ctx?

[`CapOperationContext`](CapOperationContext.md)\<`unknown`\>

#### Returns

`Promise`\<`string`\>

#### Inherited from

[`IPublishStorage`](IPublishStorage.md).[`savePublish`](IPublishStorage.md#savepublish)

***

### ~~savePublishWithTx()~~

> **savePublishWithTx**\<`T`\>(`evt`, `tx`): `Promise`\<`string`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:109](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L109)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### evt

[`CapPublishEvent`](CapPublishEvent.md)\<`T`\>

##### tx

`unknown`

#### Returns

`Promise`\<`string`\>

#### Deprecated

Use savePublish(event, { tx }) instead.
