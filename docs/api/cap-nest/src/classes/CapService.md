[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapService

# Class: CapService

Defined in: cap-nest/src/cap/cap.service.ts:32

## Constructors

### Constructor

> **new CapService**(`engine`): `CapService`

Defined in: cap-nest/src/cap/cap.service.ts:35

#### Parameters

##### engine

[`CapEngine`](CapEngine.md)

#### Returns

`CapService`

### Constructor

> **new CapService**(`pubStore`, `recStore`, `publisher`, `subscriber`, `schedulerOptions?`): `CapService`

Defined in: cap-nest/src/cap/cap.service.ts:36

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

Defined in: cap-nest/src/cap/cap.service.ts:99

#### Returns

`Promise`\<`void`\>

***

### dispatchOutboxBatch()

> **dispatchOutboxBatch**(): `Promise`\<`number`\>

Defined in: cap-nest/src/cap/cap.service.ts:91

#### Returns

`Promise`\<`number`\>

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: cap-nest/src/cap/cap.service.ts:71

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

Defined in: cap-nest/src/cap/cap.service.ts:95

#### Returns

`Promise`\<`number`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: cap-nest/src/cap/cap.service.ts:87

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: cap-nest/src/cap/cap.service.ts:79

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
