[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / LocalBus

# Class: LocalBus

Defined in: [cap-nest/src/cap/cap.module.ts:420](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L420)

## Implements

- [`IPublisher`](../interfaces/IPublisher.md)
- [`ISubscriber`](../interfaces/ISubscriber.md)

## Constructors

### Constructor

> **new LocalBus**(): `LocalBus`

#### Returns

`LocalBus`

## Methods

### consume()

> **consume**(`topic`, `_group`, `on`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.module.ts:439](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L439)

#### Parameters

##### topic

`string`

##### \_group

`string`

##### on

(`payload`, `headers?`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ISubscriber`](../interfaces/ISubscriber.md).[`consume`](../interfaces/ISubscriber.md#consume)

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `_tx?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.module.ts:426](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L426)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### \_tx?

`unknown`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IPublisher`](../interfaces/IPublisher.md).[`emit`](../interfaces/IPublisher.md#emit)
