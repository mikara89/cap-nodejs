[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqPublisher

# Class: RabbitMqPublisher

Defined in: cap-transport-rabbitmq/src/rabbitmq-publisher.ts:27

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new RabbitMqPublisher**(`options?`): `RabbitMqPublisher`

Defined in: cap-transport-rabbitmq/src/rabbitmq-publisher.ts:65

#### Parameters

##### options?

[`RabbitMqOptions`](../interfaces/RabbitMqOptions.md) = `{}`

#### Returns

`RabbitMqPublisher`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-publisher.ts:113

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-publisher.ts:83

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

### initialize()

> **initialize**(`_options?`): `Promise`\<`void`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-publisher.ts:69

#### Parameters

##### \_options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`initialize`](../../../cap-nest/src/interfaces/PublisherPort.md#initialize)
