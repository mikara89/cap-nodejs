[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-typeorm/src](../README.md) / TypeOrmReceivedStorage

# Class: TypeOrmReceivedStorage

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:49

## Implements

- [`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)
- `CapabilityAwareStoragePort`

## Constructors

### Constructor

> **new TypeOrmReceivedStorage**(`dataSource`, `options?`): `TypeOrmReceivedStorage`

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:54

#### Parameters

##### dataSource

`DataSource`

##### options?

[`TypeOrmStorageTableOptions`](../interfaces/TypeOrmStorageTableOptions.md) = `{}`

#### Returns

`TypeOrmReceivedStorage`

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:161

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

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:93

#### Returns

`CapStorageCapabilities`

#### Implementation of

`CapabilityAwareStoragePort.getCapabilities`

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](../../../cap-nest/src/interfaces/CapReceivedEvent.md)\<[`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)\>[]\>

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:139

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

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:61

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

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:168

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

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:97

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

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:112

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

Defined in: cap-storage-typeorm/src/typeorm-received-storage.ts:68

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
