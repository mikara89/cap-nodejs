[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-testing/src](../README.md) / FakeSubscriber

# Class: FakeSubscriber

Defined in: cap-core/dist/testing/fake-subscriber.d.ts:3

## Implements

- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new FakeSubscriber**(): `FakeSubscriber`

#### Returns

`FakeSubscriber`

## Properties

### listeners

> `readonly` **listeners**: `Map`\<`string`, `Set`\<[`CapHandler`](../../../cap-nest/src/type-aliases/CapHandler.md)\>\>

Defined in: cap-core/dist/testing/fake-subscriber.d.ts:4

## Methods

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/fake-subscriber.d.ts:5

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

[`CapHandler`](../../../cap-nest/src/type-aliases/CapHandler.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`consume`](../../../cap-nest/src/interfaces/SubscriberPort.md#consume)

***

### deliver()

> **deliver**(`topic`, `group`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/fake-subscriber.d.ts:6

#### Parameters

##### topic

`string`

##### group

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`SubscribeMetadata`](../../../cap-nest/src/interfaces/SubscribeMetadata.md)

#### Returns

`Promise`\<`void`\>
