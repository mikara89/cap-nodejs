[**CAP for NestJS API**](../../../README.md)

---

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / IReceivedStorage

# Interface: IReceivedStorage

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:55](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L55)

## Methods

### findReceivedById()?

> `optional` **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\> \| `undefined`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:80](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L80)

Optional: find a received record by id (dashboard helpers)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\> \| `undefined`\>

---

### getRetryDue()

> **getRetryDue**(`limit`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:69](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L69)

Return failed records whose nextRetry timestamp <= now. Scheduler uses this.

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\>[]\>

---

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:60](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L60)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

---

### listReceived()?

> `optional` **listReceived**(`opts`): `Promise`\<\{ `items`: [`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\>[]; `total?`: `number`; \}\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:83](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L83)

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

`Promise`\<\{ `items`: [`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\>[]; `total?`: `number`; \}\>

---

### markProcessed()

> **markProcessed**(`id`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:63](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L63)

Mark processed=true

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

---

### trySaveReceived()

> **trySaveReceived**\<`T`\>(`evt`): `Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts)

Persist a delivery if its dedupe identity has not been seen.
Duplicate deliveries return inserted=false and must not re-run handlers.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### evt

[`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>

---

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts)

Mark inbox processing failed, or dead-letter when retry limit is exceeded.

#### Parameters

##### id

`string`

The ID of the event to retry.

##### error

`unknown`

##### options

[`MarkReceivedFailedOptions`](MarkReceivedFailedOptions.md)

#### Returns

`Promise`\<`void`\>
