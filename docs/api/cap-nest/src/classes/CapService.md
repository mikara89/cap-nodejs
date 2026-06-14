[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapService

# Class: CapService

Defined in: [cap-nest/src/cap/cap.service.ts:40](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L40)

## Constructors

### Constructor

> **new CapService**(`pubStore`, `recStore`, `publisher`, `subscriber`): `CapService`

Defined in: [cap-nest/src/cap/cap.service.ts:49](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L49)

#### Parameters

##### pubStore

[`IPublishStorage`](../interfaces/IPublishStorage.md)

##### recStore

[`IReceivedStorage`](../interfaces/IReceivedStorage.md)

##### publisher

[`IPublisher`](../interfaces/IPublisher.md)

##### subscriber

[`ISubscriber`](../interfaces/ISubscriber.md)

#### Returns

`CapService`

## Methods

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `headers?`, `tx?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:62](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L62)

#### Type Parameters

##### T

`T`

#### Parameters

##### topic

`string`

##### payload

`T`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### tx?

`unknown`

#### Returns

`Promise`\<`void`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.service.ts:162](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L162)

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: [cap-nest/src/cap/cap.service.ts:139](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.service.ts#L139)

#### Type Parameters

##### T

`T`

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

`Handler`\<`T`\>

#### Returns

`void`
