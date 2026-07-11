[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / ResolvedRabbitMqOptions

# Interface: ResolvedRabbitMqOptions

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:38

## Properties

### autoCreateTopology

> **autoCreateTopology**: `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:50

***

### confirmTimeoutMs

> **confirmTimeoutMs**: `number`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:51

***

### connectionFactory

> **connectionFactory**: [`RabbitMqConnectionFactory`](../type-aliases/RabbitMqConnectionFactory.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:41

***

### deadLetterExchange?

> `optional` **deadLetterExchange?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:48

***

### deadLetterRoutingKey?

> `optional` **deadLetterRoutingKey?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:49

***

### exchangeDurable

> **exchangeDurable**: `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:44

***

### exchangeName

> **exchangeName**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:42

***

### exchangeType

> **exchangeType**: `"topic"`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:43

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:54

***

### prefetch

> **prefetch**: `number`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:47

***

### queuePrefix

> **queuePrefix**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:45

***

### queueType

> **queueType**: [`RabbitMqQueueType`](../type-aliases/RabbitMqQueueType.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:46

***

### reconnect

> **reconnect**: `Required`\<[`RabbitMqRetryOptions`](RabbitMqRetryOptions.md)\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:52

***

### requeueOnHandlerError

> **requeueOnHandlerError**: `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:53

***

### socketOptions?

> `optional` **socketOptions?**: `Connect`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:40

***

### url

> **url**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:39
