[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / ReceivedStoragePort

# Interface: ReceivedStoragePort

Defined in: cap-core/dist/ports/received-storage.port.d.ts:16

## Methods

### findReceivedById()?

> `optional` **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: cap-core/dist/ports/received-storage.port.d.ts:22

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: cap-core/dist/ports/received-storage.port.d.ts:20

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

Defined in: cap-core/dist/ports/received-storage.port.d.ts:18

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

***

### listReceived()?

> `optional` **listReceived**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: cap-core/dist/ports/received-storage.port.d.ts:23

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/received-storage.port.d.ts:19

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

Defined in: cap-core/dist/ports/received-storage.port.d.ts:21

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkReceivedFailedOptions`

#### Returns

`Promise`\<`void`\>

***

### trySaveReceived()

> **trySaveReceived**\<`T`\>(`event`): `Promise`\<`TrySaveReceivedResult`\<`T`\>\>

Defined in: cap-core/dist/ports/received-storage.port.d.ts:17

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<`TrySaveReceivedResult`\<`T`\>\>
