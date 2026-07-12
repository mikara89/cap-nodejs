[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqSubscriber

# Class: RabbitMqSubscriber

Defined in: [cap-transport-rabbitmq/src/rabbitmq-subscriber.ts:44](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-subscriber.ts#L44)

## Implements

- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new RabbitMqSubscriber**(`options?`): `RabbitMqSubscriber`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-subscriber.ts:86](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-subscriber.ts#L86)

#### Parameters

##### options?

[`RabbitMqOptions`](../interfaces/RabbitMqOptions.md) = `{}`

#### Returns

`RabbitMqSubscriber`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-transport-rabbitmq/src/rabbitmq-subscriber.ts:129](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-subscriber.ts#L129)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`close`](../../../cap-nest/src/interfaces/SubscriberPort.md#close)

***

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: [cap-transport-rabbitmq/src/rabbitmq-subscriber.ts:104](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-subscriber.ts#L104)

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

### dispatchDelivery()

> **dispatchDelivery**(`group`, `message`): `Promise`\<`void`\>

Defined in: [cap-transport-rabbitmq/src/rabbitmq-subscriber.ts:254](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-subscriber.ts#L254)

Adapter delivery boundary, exposed for controlled broker harnesses.

#### Parameters

##### group

`string`

##### message

`ConsumeMessage` \| `null`

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(`_options?`): `Promise`\<`void`\>

Defined in: [cap-transport-rabbitmq/src/rabbitmq-subscriber.ts:90](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-subscriber.ts#L90)

#### Parameters

##### \_options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`initialize`](../../../cap-nest/src/interfaces/SubscriberPort.md#initialize)
