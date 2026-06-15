[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / LocalBus

# Class: LocalBus

Defined in: [cap-nest/src/cap/cap.module.ts:126](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L126)

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

Defined in: [cap-nest/src/cap/cap.module.ts:153](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L153)

#### Parameters

##### topic

`string`

##### \_group

`string`

##### on

(`payload`, `headers?`, `metadata?`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ISubscriber`](../interfaces/ISubscriber.md).[`consume`](../interfaces/ISubscriber.md#consume)

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.module.ts:132](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L132)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### metadata?

[`CapPublishMetadata`](../interfaces/CapPublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IPublisher`](../interfaces/IPublisher.md).[`emit`](../interfaces/IPublisher.md#emit)
