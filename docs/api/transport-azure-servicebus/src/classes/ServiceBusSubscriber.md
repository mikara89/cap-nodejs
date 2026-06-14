[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-azure-servicebus/src](../README.md) / ServiceBusSubscriber

# Class: ServiceBusSubscriber

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:26](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L26)

## Implements

- `ISubscriber`
- `OnModuleDestroy`

## Constructors

### Constructor

> **new ServiceBusSubscriber**(`client`, `configOrTopicPrefix?`, `subscriptionPrefix?`): `ServiceBusSubscriber`

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:35](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L35)

#### Parameters

##### client

`ServiceBusClient`

##### configOrTopicPrefix?

`string` \| [`ServiceBusConfig`](../interfaces/ServiceBusConfig.md)

##### subscriptionPrefix?

`string`

#### Returns

`ServiceBusSubscriber`

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:92](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L92)

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

`ISubscriber.consume`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:53](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L53)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createQueues?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`ISubscriber.initialize`

***

### onModuleDestroy()

> **onModuleDestroy**(): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:350](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L350)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`OnModuleDestroy.onModuleDestroy`
