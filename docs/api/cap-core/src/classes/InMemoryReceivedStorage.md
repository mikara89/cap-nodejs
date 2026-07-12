[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / InMemoryReceivedStorage

# Class: InMemoryReceivedStorage

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L9)

## Implements

- [`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md)

## Constructors

### Constructor

> **new InMemoryReceivedStorage**(): `InMemoryReceivedStorage`

#### Returns

`InMemoryReceivedStorage`

## Properties

### store

> `readonly` **store**: `Map`\<`string`, [`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:10](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L10)

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:76](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L76)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md).[`findReceivedById`](../interfaces/ReceivedStoragePort.md#findreceivedbyid)

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L42)

#### Parameters

##### limit

`number`

##### now?

`Date` = `...`

#### Returns

`Promise`\<[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

#### Implementation of

[`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md).[`getRetryDue`](../interfaces/ReceivedStoragePort.md#getretrydue)

***

### listReceived()

> **listReceived**(`options?`): `Promise`\<\{ `items`: [`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:83](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L83)

#### Parameters

##### options?

###### due?

`boolean`

###### limit?

`number`

###### offset?

`number`

###### topic?

`string`

#### Returns

`Promise`\<\{ `items`: [`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

#### Implementation of

[`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md).[`listReceived`](../interfaces/ReceivedStoragePort.md#listreceived)

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L31)

#### Parameters

##### id

`string`

##### processedAt?

`Date` = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md).[`markProcessed`](../interfaces/ReceivedStoragePort.md#markprocessed)

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:60](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L60)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

[`MarkReceivedFailedOptions`](../interfaces/MarkReceivedFailedOptions.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md).[`markReceivedFailed`](../interfaces/ReceivedStoragePort.md#markreceivedfailed)

***

### trySaveReceived()

> **trySaveReceived**\<`T`\>(`event`): `Promise`\<[`TrySaveReceivedResult`](../interfaces/TrySaveReceivedResult.md)\<`T`\>\>

Defined in: [cap-core/src/testing/in-memory-received-storage.ts:13](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/in-memory-received-storage.ts#L13)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<[`TrySaveReceivedResult`](../interfaces/TrySaveReceivedResult.md)\<`T`\>\>

#### Implementation of

[`ReceivedStoragePort`](../interfaces/ReceivedStoragePort.md).[`trySaveReceived`](../interfaces/ReceivedStoragePort.md#trysavereceived)
