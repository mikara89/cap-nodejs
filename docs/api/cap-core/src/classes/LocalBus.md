[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / LocalBus

# Class: LocalBus

Defined in: [cap-core/src/testing/local-bus.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/local-bus.ts#L18)

## Implements

- [`PublisherPort`](../interfaces/PublisherPort.md)
- [`SubscriberPort`](../interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new LocalBus**(): `LocalBus`

#### Returns

`LocalBus`

## Properties

### listeners

> `readonly` **listeners**: `Map`\<`string`, `Set`\<`Listener`\>\>

Defined in: [cap-core/src/testing/local-bus.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/local-bus.ts#L19)

## Methods

### consume()

> **consume**(`topic`, `_group`, `handler`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/local-bus.ts:44](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/local-bus.ts#L44)

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

[`SubscriberPort`](../interfaces/SubscriberPort.md).[`consume`](../interfaces/SubscriberPort.md#consume)

***

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/local-bus.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/local-bus.ts#L21)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](../interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../interfaces/PublisherPort.md).[`emit`](../interfaces/PublisherPort.md#emit)
