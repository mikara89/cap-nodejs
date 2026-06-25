[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / IReceivedStorage

# Interface: IReceivedStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:99](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L99)

## Methods

### findReceivedById()?

> `optional` **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:128](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L128)

Optional: find a received record by id (dashboard helpers)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### getRetryDue()

> **getRetryDue**(`limit`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:118](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L118)

Return records that are not yet processed and
whose nextRetry timestamp <= now. Scheduler uses this.

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:109](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L109)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

### listReceived()?

> `optional` **listReceived**(`opts`): `Promise`\<\{ `items`: [`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:131](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L131)

Optional: paginated listing for dashboards and admin UIs

#### Parameters

##### opts

###### due?

`boolean`

###### limit?

`number`

###### offset?

`number`

###### topic?

`string`

#### Returns

`Promise`\<\{ `items`: [`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

***

### markProcessed()

> **markProcessed**(`id`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:112](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L112)

Mark processed=true

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:121](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L121)

Mark inbox processing failed, or dead-letter when retry limit is exceeded.

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkReceivedFailedOptions`](MarkReceivedFailedOptions.md)

#### Returns

`Promise`\<`void`\>

***

### trySaveReceived()

> **trySaveReceived**\<`T`\>(`evt`): `Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:104](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L104)

Persist a delivery if its dedupe identity has not been seen.
Duplicate deliveries return inserted=false and must not re-run handlers.

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### evt

[`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>
