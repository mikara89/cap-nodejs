[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapService

# Class: CapService

Defined in: [cap-nest/src/cap/cap.service.ts:38](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L38)

## Constructors

### Constructor

> **new CapService**(`engine`): `CapService`

Defined in: [cap-nest/src/cap/cap.service.ts:41](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L41)

#### Parameters

##### engine

[`CapEngine`](CapEngine.md)

#### Returns

`CapService`

### Constructor

> **new CapService**(`pubStore`, `recStore`, `publisher`, `subscriber`, `schedulerOptions?`): `CapService`

Defined in: [cap-nest/src/cap/cap.service.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L42)

#### Parameters

##### pubStore

[`IPublishStorage`](../interfaces/IPublishStorage.md)

##### recStore

[`IReceivedStorage`](../interfaces/IReceivedStorage.md)

##### publisher

[`IPublisher`](../interfaces/IPublisher.md)

##### subscriber

[`ISubscriber`](../interfaces/ISubscriber.md)

##### schedulerOptions?

[`ResolvedCapSchedulerOptions`](../interfaces/ResolvedCapSchedulerOptions.md)

#### Returns

`CapService`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:112](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L112)

#### Returns

`Promise`\<`void`\>

***

### dispatchOutboxBatch()

> **dispatchOutboxBatch**(): `Promise`\<`number`\>

Defined in: [cap-nest/src/cap/cap.service.ts:104](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L104)

#### Returns

`Promise`\<`number`\>

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:77](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L77)

#### Type Parameters

##### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### options?

[`CapPublishOptions`](../interfaces/CapPublishOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

***

### retryInboxBatch()

> **retryInboxBatch**(): `Promise`\<`number`\>

Defined in: [cap-nest/src/cap/cap.service.ts:108](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L108)

#### Returns

`Promise`\<`number`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:100](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L100)

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: [cap-nest/src/cap/cap.service.ts:85](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L85)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

`Handler`\<`T`\>

#### Returns

`void`

***

### transaction()

> **transaction**\<`T`\>(`fn`, `options?`): `Promise`\<`T`\>

Defined in: [cap-nest/src/cap/cap.service.ts:93](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L93)

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`ctx`) => `Promise`\<`T`\>

##### options?

[`CapTransactionOptions`](../interfaces/CapTransactionOptions.md)

#### Returns

`Promise`\<`T`\>
