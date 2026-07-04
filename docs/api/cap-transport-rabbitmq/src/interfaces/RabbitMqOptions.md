[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqOptions

# Interface: RabbitMqOptions

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L18)

## Properties

### autoCreateTopology?

> `optional` **autoCreateTopology?**: `boolean`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L31)

***

### confirmTimeoutMs?

> `optional` **confirmTimeoutMs?**: `number`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L32)

***

### connectionFactory?

> `optional` **connectionFactory?**: [`RabbitMqConnectionFactory`](../type-aliases/RabbitMqConnectionFactory.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L21)

***

### deadLetterExchange?

> `optional` **deadLetterExchange?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L29)

***

### deadLetterRoutingKey?

> `optional` **deadLetterRoutingKey?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L30)

***

### exchangeDurable?

> `optional` **exchangeDurable?**: `boolean`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:24](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L24)

***

### exchangeName?

> `optional` **exchangeName?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L22)

***

### exchangeType?

> `optional` **exchangeType?**: `"topic"`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:23](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L23)

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:35](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L35)

***

### namingPrefix?

> `optional` **namingPrefix?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:25](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L25)

***

### prefetch?

> `optional` **prefetch?**: `number`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L28)

***

### queuePrefix?

> `optional` **queuePrefix?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L26)

***

### queueType?

> `optional` **queueType?**: [`RabbitMqQueueType`](../type-aliases/RabbitMqQueueType.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L27)

***

### reconnect?

> `optional` **reconnect?**: [`RabbitMqRetryOptions`](RabbitMqRetryOptions.md)

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L33)

***

### requeueOnHandlerError?

> `optional` **requeueOnHandlerError?**: `boolean`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L34)

***

### socketOptions?

> `optional` **socketOptions?**: `Connect`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L20)

***

### url?

> `optional` **url?**: `string`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-options.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-options.ts#L19)
