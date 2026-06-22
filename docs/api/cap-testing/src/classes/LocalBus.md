[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-testing/src](../README.md) / LocalBus

# Class: LocalBus

Defined in: cap-core/dist/testing/local-bus.d.ts:6

## Extended by

- [`LocalBus`](../../../cap-nest/src/classes/LocalBus.md)

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)
- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new LocalBus**(): `LocalBus`

#### Returns

`LocalBus`

## Properties

### listeners

> `readonly` **listeners**: `Map`\<`string`, `Set`\<`Listener`\>\>

Defined in: cap-core/dist/testing/local-bus.d.ts:7

## Methods

### consume()

> **consume**(`topic`, `_group`, `handler`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/local-bus.d.ts:9

#### Parameters

##### topic

`string`

##### \_group

`string`

##### handler

`Listener`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`consume`](../../../cap-nest/src/interfaces/SubscriberPort.md#consume)

***

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/local-bus.d.ts:8

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](../../../cap-nest/src/interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`emit`](../../../cap-nest/src/interfaces/PublisherPort.md#emit)
