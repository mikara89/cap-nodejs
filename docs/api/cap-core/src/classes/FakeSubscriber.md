[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / FakeSubscriber

# Class: FakeSubscriber

Defined in: [cap-core/src/testing/fake-subscriber.ts:8](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-subscriber.ts#L8)

## Implements

- [`SubscriberPort`](../interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new FakeSubscriber**(): `FakeSubscriber`

#### Returns

`FakeSubscriber`

## Properties

### listeners

> `readonly` **listeners**: `Map`\<`string`, `Set`\<[`CapHandler`](../type-aliases/CapHandler.md)\>\>

Defined in: [cap-core/src/testing/fake-subscriber.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-subscriber.ts#L9)

## Methods

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/fake-subscriber.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-subscriber.ts#L11)

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

[`CapHandler`](../type-aliases/CapHandler.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../interfaces/SubscriberPort.md).[`consume`](../interfaces/SubscriberPort.md#consume)

***

### deliver()

> **deliver**(`topic`, `group`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/fake-subscriber.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-subscriber.ts#L18)

#### Parameters

##### topic

`string`

##### group

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### metadata?

[`SubscribeMetadata`](../interfaces/SubscribeMetadata.md)

#### Returns

`Promise`\<`void`\>
