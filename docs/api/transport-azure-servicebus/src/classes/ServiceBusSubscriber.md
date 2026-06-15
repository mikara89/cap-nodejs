[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-azure-servicebus/src](../README.md) / ServiceBusSubscriber

# Class: ServiceBusSubscriber

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:31](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L31)

## Implements

- `ISubscriber`
- `OnModuleDestroy`

## Constructors

### Constructor

> **new ServiceBusSubscriber**(`client`, `configOrTopicPrefix?`, `subscriptionPrefix?`): `ServiceBusSubscriber`

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:40](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L40)

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

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:97](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L97)

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

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:58](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L58)

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

Defined in: [transport-azure-servicebus/src/transport/servicebus-subscriber.ts:360](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-subscriber.ts#L360)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`OnModuleDestroy.onModuleDestroy`
