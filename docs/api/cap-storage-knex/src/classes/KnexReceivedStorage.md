[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-knex/src](../README.md) / KnexReceivedStorage

# Class: KnexReceivedStorage

Defined in: cap-storage-knex/src/knex-received-storage.ts:47

## Implements

- [`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new KnexReceivedStorage**(`knex`, `options?`): `KnexReceivedStorage`

Defined in: cap-storage-knex/src/knex-received-storage.ts:52

#### Parameters

##### knex

`Knex`

##### options?

[`KnexStorageTableOptions`](../interfaces/KnexStorageTableOptions.md) = `{}`

#### Returns

`KnexReceivedStorage`

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-storage-knex/src/knex-received-storage.ts:141

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`findReceivedById`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#findreceivedbyid)

***

### getCapabilities()

> **getCapabilities**(): `CapStorageCapabilities`

Defined in: cap-storage-knex/src/knex-received-storage.ts:86

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: cap-storage-knex/src/knex-received-storage.ts:128

#### Parameters

##### limit

`number`

##### now?

`Date` = `...`

#### Returns

`Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`getRetryDue`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#getretrydue)

***

### initialize()

> **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-received-storage.ts:59

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`initialize`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#initialize)

***

### listReceived()

> **listReceived**(`options?`): `Promise`\<[`DashboardListResult`](../../../cap-nest/src/interfaces/DashboardListResult.md)\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>\>\>

Defined in: cap-storage-knex/src/knex-received-storage.ts:150

#### Parameters

##### options?

[`DashboardListOptions`](../../../cap-nest/src/interfaces/DashboardListOptions.md) = `{}`

#### Returns

`Promise`\<[`DashboardListResult`](../../../cap-nest/src/interfaces/DashboardListResult.md)\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>\>\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`listReceived`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#listreceived)

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-received-storage.ts:90

#### Parameters

##### id

`string`

##### processedAt?

`Date` = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`markProcessed`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#markprocessed)

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-storage-knex/src/knex-received-storage.ts:102

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

Defined in: cap-storage-knex/src/knex-received-storage.ts:64

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
