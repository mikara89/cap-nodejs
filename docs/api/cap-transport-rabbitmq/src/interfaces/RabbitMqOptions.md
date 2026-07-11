[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqOptions

# Interface: RabbitMqOptions

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:18

## Properties

### autoCreateTopology?

> `optional` **autoCreateTopology?**: `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:31

***

### confirmTimeoutMs?

> `optional` **confirmTimeoutMs?**: `number`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:32

***

### connectionFactory?

> `optional` **connectionFactory?**: [`RabbitMqConnectionFactory`](../type-aliases/RabbitMqConnectionFactory.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:21

***

### deadLetterExchange?

> `optional` **deadLetterExchange?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:29

***

### deadLetterRoutingKey?

> `optional` **deadLetterRoutingKey?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:30

***

### exchangeDurable?

> `optional` **exchangeDurable?**: `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:24

***

### exchangeName?

> `optional` **exchangeName?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:22

***

### exchangeType?

> `optional` **exchangeType?**: `"topic"`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:23

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:35

***

### namingPrefix?

> `optional` **namingPrefix?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:25

***

### prefetch?

> `optional` **prefetch?**: `number`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:28

***

### queuePrefix?

> `optional` **queuePrefix?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:26

***

### queueType?

> `optional` **queueType?**: [`RabbitMqQueueType`](../type-aliases/RabbitMqQueueType.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:27

***

### reconnect?

> `optional` **reconnect?**: [`RabbitMqRetryOptions`](RabbitMqRetryOptions.md)

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:33

***

### requeueOnHandlerError?

> `optional` **requeueOnHandlerError?**: `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:34

***

### socketOptions?

> `optional` **socketOptions?**: `Connect`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:20

***

### url?

> `optional` **url?**: `string`

Defined in: cap-transport-rabbitmq/src/rabbitmq-options.ts:19
