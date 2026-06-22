[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-testing/src](../README.md) / InMemoryReceivedStorage

# Class: InMemoryReceivedStorage

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:4

## Implements

- [`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)

## Constructors

### Constructor

> **new InMemoryReceivedStorage**(): `InMemoryReceivedStorage`

#### Returns

`InMemoryReceivedStorage`

## Properties

### store

> `readonly` **store**: `Map`\<`string`, [`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:5

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:11

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`findReceivedById`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#findreceivedbyid)

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:9

#### Parameters

##### limit

`number`

##### now?

`Date`

#### Returns

`Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`getRetryDue`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#getretrydue)

***

### listReceived()

> **listReceived**(`options?`): `Promise`\<\{ `items`: [`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:12

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

`Promise`\<\{ `items`: [`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`listReceived`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#listreceived)

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:8

#### Parameters

##### id

`string`

##### processedAt?

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`markProcessed`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#markprocessed)

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:10

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkReceivedFailedOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`markReceivedFailed`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#markreceivedfailed)

***

### trySaveReceived()

> **trySaveReceived**\<`T`\>(`event`): `Promise`\<`TrySaveReceivedResult`\<`T`\>\>

Defined in: cap-core/dist/testing/in-memory-received-storage.d.ts:7

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<`TrySaveReceivedResult`\<`T`\>\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`trySaveReceived`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#trysavereceived)
