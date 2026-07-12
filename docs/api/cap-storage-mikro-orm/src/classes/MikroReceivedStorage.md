[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / MikroReceivedStorage

# Class: MikroReceivedStorage

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L15)

## Implements

- [`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new MikroReceivedStorage**(`em`, `orm?`, `logger?`): `MikroReceivedStorage`

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L18)

#### Parameters

##### em

`EntityManager`

##### orm?

`MikroORM`\<`IDatabaseDriver`\<`Connection`\>, `EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

##### logger?

[`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

#### Returns

`MikroReceivedStorage`

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:153](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L153)

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

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:103](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L103)

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:134](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L134)

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

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L24)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createSchema?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`initialize`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#initialize)

***

### listReceived()

> **listReceived**(`opts`): `Promise`\<\{ `items`: [`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:160](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L160)

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

`Promise`\<\{ `items`: [`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]; `total`: `number`; \}\>

#### Implementation of

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md).[`listReceived`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md#listreceived)

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:107](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L107)

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

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:117](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L117)

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

Defined in: [cap-storage-mikro-orm/src/storage/mikro-received-storage.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/storage/mikro-received-storage.ts#L50)

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
