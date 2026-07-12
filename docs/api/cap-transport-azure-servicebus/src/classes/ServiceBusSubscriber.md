[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-azure-servicebus/src](../README.md) / ServiceBusSubscriber

# Class: ServiceBusSubscriber

Defined in: [cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L30)

## Implements

- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new ServiceBusSubscriber**(`client`, `configOrTopicPrefix?`, `subscriptionPrefix?`, `logger?`): `ServiceBusSubscriber`

Defined in: [cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts:38](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L38)

#### Parameters

##### client

`ServiceBusClient`

##### configOrTopicPrefix?

`string` \| [`ServiceBusOptions`](../interfaces/ServiceBusOptions.md)

##### subscriptionPrefix?

`string`

##### logger?

[`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

#### Returns

`ServiceBusSubscriber`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts:376](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L376)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`close`](../../../cap-nest/src/interfaces/SubscriberPort.md#close)

***

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: [cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts:99](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L99)

#### Parameters

##### topic

`string`

##### group

`string`

##### onMessage

`CapMessageHandler`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`consume`](../../../cap-nest/src/interfaces/SubscriberPort.md#consume)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L57)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createQueues?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`initialize`](../../../cap-nest/src/interfaces/SubscriberPort.md#initialize)

***

### onModuleDestroy()

> **onModuleDestroy**(): `Promise`\<`void`\>

Defined in: [cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts:372](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L372)

#### Returns

`Promise`\<`void`\>
