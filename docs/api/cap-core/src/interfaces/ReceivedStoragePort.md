[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-core/src](../README.md) / ReceivedStoragePort

# Interface: ReceivedStoragePort

Defined in: cap-core/src/ports/received-storage.port.ts:23

## Methods

### findReceivedById()?

> `optional` **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-core/src/ports/received-storage.port.ts:40

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: cap-core/src/ports/received-storage.port.ts:32

#### Parameters

##### limit

`number`

##### now?

`Date`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-core/src/ports/received-storage.port.ts:28

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

### listReceived()?

> `optional` **listReceived**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: cap-core/src/ports/received-storage.port.ts:42

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: cap-core/src/ports/received-storage.port.ts:30

#### Parameters

##### id

`string`

##### processedAt?

`Date`

#### Returns

`Promise`\<`void`\>

***

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: cap-core/src/ports/received-storage.port.ts:34

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

> **trySaveReceived**\<`T`\>(`event`): `Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>

Defined in: cap-core/src/ports/received-storage.port.ts:24

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>
