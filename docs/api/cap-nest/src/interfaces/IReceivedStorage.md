[**CAP for NestJS API**](../../../README.md)

***

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

***

### getRetryDue()

> **getRetryDue**(`limit`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\>[]\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:69](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L69)

Return records that are not yet processed and
whose nextRetry timestamp <= now.  Scheduler uses this.

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<`unknown`\>[]\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:60](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L60)

Optional one-time initialization: create schema/tables if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

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

***

### markProcessed()

> **markProcessed**(`id`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:63](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L63)

Mark processed=true

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### saveReceived()

> **saveReceived**\<`T`\>(`evt`): `Promise`\<`string`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:57](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L57)

Persist a delivery; return record id

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### evt

[`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<`string`\>

***

### scheduleRetry()

> **scheduleRetry**(`id`, `retryCount`, `nextRetry`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/storage.interface.ts:77](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/storage.interface.ts#L77)

Schedule a retry for a given event.

#### Parameters

##### id

`string`

The ID of the event to retry.

##### retryCount

`number`

The number of retry attempts made so far.

##### nextRetry

`Date`

The next scheduled retry time.

#### Returns

`Promise`\<`void`\>
