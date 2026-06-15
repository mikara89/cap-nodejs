[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapService

# Class: CapService

Defined in: [cap-nest/src/cap/cap.service.ts:54](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L54)

## Constructors

### Constructor

> **new CapService**(`pubStore`, `recStore`, `publisher`, `subscriber`, `schedulerOptions?`): `CapService`

Defined in: [cap-nest/src/cap/cap.service.ts:58](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L58)

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

[`ResolvedCapSchedulerOptions`](../interfaces/ResolvedCapSchedulerOptions.md) = `DEFAULT_SCHEDULER_OPTIONS`

#### Returns

`CapService`

## Methods

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:67](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L67)

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

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:142](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L142)

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: [cap-nest/src/cap/cap.service.ts:109](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L109)

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
