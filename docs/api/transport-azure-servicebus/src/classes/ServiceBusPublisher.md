[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-azure-servicebus/src](../README.md) / ServiceBusPublisher

# Class: ServiceBusPublisher

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:11](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L11)

Azure Service Bus implementation of IPublisher.
Sends messages to Service Bus topics.

## Implements

- `IPublisher`
- `OnModuleDestroy`

## Constructors

### Constructor

> **new ServiceBusPublisher**(`client`, `config`): `ServiceBusPublisher`

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L15)

#### Parameters

##### client

`ServiceBusClient`

##### config

[`ServiceBusConfig`](../interfaces/ServiceBusConfig.md)

#### Returns

`ServiceBusPublisher`

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`, `_tx?`): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:48](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L48)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

`CapHeaders`

##### \_tx?

`unknown`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublisher.emit`

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:20](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L20)

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

Defined in: [transport-azure-servicebus/src/transport/servicebus-publisher.ts:79](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/transport/servicebus-publisher.ts#L79)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`OnModuleDestroy.onModuleDestroy`
