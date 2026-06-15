[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-azure-servicebus/src](../README.md) / ServiceBusPublisher

# Class: ServiceBusPublisher

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L15)

Azure Service Bus implementation of IPublisher.
Sends messages to Service Bus topics.

## Implements

- `IPublisher`
- `OnModuleDestroy`

## Constructors

### Constructor

> **new ServiceBusPublisher**(`client`, `config`): `ServiceBusPublisher`

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:19](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L19)

#### Parameters

##### client

`ServiceBusClient`

##### config

[`ServiceBusConfig`](../interfaces/ServiceBusConfig.md)

#### Returns

`ServiceBusPublisher`

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:52](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L52)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

`CapHeaders`

##### metadata?

`CapPublishMetadata`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublisher.emit`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:24](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L24)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createQueues?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublisher.initialize`

***

### onModuleDestroy()

> **onModuleDestroy**(): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:84](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L84)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`OnModuleDestroy.onModuleDestroy`
