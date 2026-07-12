[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / ReceivedStoragePort

# Interface: ReceivedStoragePort

Defined in: [cap-core/src/ports/received-storage.port.ts:23](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L23)

## Methods

### findReceivedById()?

> `optional` **findReceivedById**(`id`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

Defined in: [cap-core/src/ports/received-storage.port.ts:40](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L40)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\> \| `undefined`\>

***

### getRetryDue()

> **getRetryDue**(`limit`, `now?`): `Promise`\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>[]\>

Defined in: [cap-core/src/ports/received-storage.port.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L32)

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

Defined in: [cap-core/src/ports/received-storage.port.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L28)

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>

***

### listReceived()?

> `optional` **listReceived**(`options`): `Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

Defined in: [cap-core/src/ports/received-storage.port.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L42)

#### Parameters

##### options

[`DashboardListOptions`](DashboardListOptions.md)

#### Returns

`Promise`\<[`DashboardListResult`](DashboardListResult.md)\<[`CapReceivedEvent`](CapReceivedEvent.md)\<[`JsonValue`](../type-aliases/JsonValue.md)\>\>\>

***

### markProcessed()

> **markProcessed**(`id`, `processedAt?`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/received-storage.port.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L30)

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

Defined in: [cap-core/src/ports/received-storage.port.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L34)

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

Defined in: [cap-core/src/ports/received-storage.port.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/received-storage.port.ts#L24)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### event

[`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

#### Returns

`Promise`\<[`TrySaveReceivedResult`](TrySaveReceivedResult.md)\<`T`\>\>
