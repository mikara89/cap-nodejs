[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / LocalBus

# Class: LocalBus

Defined in: [cap-nest/src/cap/cap.module.ts:133](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L133)

## Extends

- [`LocalBus`](../../../cap-testing/src/classes/LocalBus.md)

## Implements

- [`IPublisher`](../interfaces/IPublisher.md)
- [`ISubscriber`](../interfaces/ISubscriber.md)

## Constructors

### Constructor

> **new LocalBus**(): `LocalBus`

#### Returns

`LocalBus`

#### Inherited from

[`LocalBus`](../../../cap-testing/src/classes/LocalBus.md).[`constructor`](../../../cap-testing/src/classes/LocalBus.md#constructor)

## Properties

### listeners

> `readonly` **listeners**: `Map`\<`string`, `Set`\<`Listener`\>\>

Defined in: cap-core/dist/testing/local-bus.d.ts:7

#### Inherited from

[`LocalBus`](../../../cap-testing/src/classes/LocalBus.md).[`listeners`](../../../cap-testing/src/classes/LocalBus.md#listeners)

## Methods

### consume()

> **consume**(`topic`, `group`, `on`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.module.ts:143](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L143)

#### Parameters

##### topic

`string`

##### group

`string`

##### on

(`payload`, `headers?`, `metadata?`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ISubscriber`](../interfaces/ISubscriber.md).[`consume`](../interfaces/ISubscriber.md#consume)

#### Overrides

[`LocalBus`](../../../cap-testing/src/classes/LocalBus.md).[`consume`](../../../cap-testing/src/classes/LocalBus.md#consume)

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/cap.module.ts:134](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/cap.module.ts#L134)

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

#### Overrides

[`LocalBus`](../../../cap-testing/src/classes/LocalBus.md).[`emit`](../../../cap-testing/src/classes/LocalBus.md#emit)
