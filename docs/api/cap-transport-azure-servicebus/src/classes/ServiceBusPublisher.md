[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-azure-servicebus/src](../README.md) / ServiceBusPublisher

# Class: ServiceBusPublisher

Defined in: cap-transport-azure-servicebus/src/transport/servicebus-publisher.ts:17

Azure Service Bus implementation of PublisherPort.
Sends messages to Service Bus topics.

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new ServiceBusPublisher**(`client`, `config`, `logger?`): `ServiceBusPublisher`

Defined in: cap-transport-azure-servicebus/src/transport/servicebus-publisher.ts:20

#### Parameters

##### client

`ServiceBusClient`

##### config

[`ServiceBusOptions`](../interfaces/ServiceBusOptions.md)

##### logger?

[`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

#### Returns

`ServiceBusPublisher`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-transport-azure-servicebus/src/transport/servicebus-publisher.ts:85

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-transport-azure-servicebus/src/transport/servicebus-publisher.ts:53

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](../../../cap-nest/src/interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`emit`](../../../cap-nest/src/interfaces/PublisherPort.md#emit)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-transport-azure-servicebus/src/transport/servicebus-publisher.ts:26

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createQueues?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`initialize`](../../../cap-nest/src/interfaces/PublisherPort.md#initialize)

***

### onModuleDestroy()

> **onModuleDestroy**(): `Promise`\<`void`\>

Defined in: cap-transport-azure-servicebus/src/transport/servicebus-publisher.ts:97

#### Returns

`Promise`\<`void`\>
