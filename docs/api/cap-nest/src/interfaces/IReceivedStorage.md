[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / IReceivedStorage

# Interface: IReceivedStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:90](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L90)

## Methods

### findReceivedById()?

> `optional` **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:119](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L119)

Optional: find a received record by id (dashboard helpers)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### getRetryDue()

> **getRetryDue**(`limit`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:109](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L109)

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

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:100](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L100)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

### listReceived()?

> `optional` **listReceived**(`opts`): `Promise`\<\{ `items`: [`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total?`: `number`; \}\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:122](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L122)

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

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:103](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L103)

Mark processed=true

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:112](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L112)

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

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:95](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L95)

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
