[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaSubscriber

# Class: KafkaSubscriber

Defined in: cap-transport-kafka/src/kafka-subscriber.ts:33

## Implements

- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new KafkaSubscriber**(`options?`): `KafkaSubscriber`

Defined in: cap-transport-kafka/src/kafka-subscriber.ts:39

#### Parameters

##### options?

[`KafkaOptions`](../interfaces/KafkaOptions.md) = `{}`

#### Returns

`KafkaSubscriber`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-transport-kafka/src/kafka-subscriber.ts:131

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`close`](../../../cap-nest/src/interfaces/SubscriberPort.md#close)

***

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: cap-transport-kafka/src/kafka-subscriber.ts:49

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

> **dispatchDelivery**(`group`, `delivery`): `Promise`\<`void`\>

Defined in: cap-transport-kafka/src/kafka-subscriber.ts:94

Adapter delivery boundary, exposed for controlled broker harnesses.

#### Parameters

##### group

`string`

##### delivery

[`EachMessagePayload`](../interfaces/EachMessagePayload.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(`_options?`): `Promise`\<`void`\>

Defined in: cap-transport-kafka/src/kafka-subscriber.ts:45

#### Parameters

##### \_options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`initialize`](../../../cap-nest/src/interfaces/SubscriberPort.md#initialize)
