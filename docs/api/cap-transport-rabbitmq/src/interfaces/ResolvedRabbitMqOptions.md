[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / ResolvedRabbitMqOptions

# Interface: ResolvedRabbitMqOptions

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:38](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L38)

## Properties

### autoCreateTopology

> **autoCreateTopology**: `boolean`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L50)

***

### confirmTimeoutMs

> **confirmTimeoutMs**: `number`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:51](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L51)

***

### connectionFactory

> **connectionFactory**: [`RabbitMqConnectionFactory`](../type-aliases/RabbitMqConnectionFactory.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:41](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L41)

***

### deadLetterExchange?

> `optional` **deadLetterExchange?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:48](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L48)

***

### deadLetterRoutingKey?

> `optional` **deadLetterRoutingKey?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L49)

***

### exchangeDurable

> **exchangeDurable**: `boolean`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:44](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L44)

***

### exchangeName

> **exchangeName**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L42)

***

### exchangeType

> **exchangeType**: `"topic"`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:43](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L43)

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:54](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L54)

***

### prefetch

> **prefetch**: `number`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:47](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L47)

***

### queuePrefix

> **queuePrefix**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:45](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L45)

***

### queueType

> **queueType**: [`RabbitMqQueueType`](../type-aliases/RabbitMqQueueType.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:46](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L46)

***

### reconnect

> **reconnect**: `Required`\<[`RabbitMqRetryOptions`](RabbitMqRetryOptions.md)\>

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:52](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L52)

***

### requeueOnHandlerError

> **requeueOnHandlerError**: `boolean`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:53](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L53)

***

### socketOptions?

> `optional` **socketOptions?**: `Connect`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:40](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L40)

***

### url

> **url**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:39](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L39)
