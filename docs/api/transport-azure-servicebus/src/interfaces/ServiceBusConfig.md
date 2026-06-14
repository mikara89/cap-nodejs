[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-azure-servicebus/src](../README.md) / ServiceBusConfig

# Interface: ServiceBusConfig

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:4](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L4)

Configuration options for Azure Service Bus transport.

## Properties

### connectionString

> **connectionString**: `string`

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:9](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L9)

Azure Service Bus connection string.
Get this from Azure Portal > Service Bus Namespace > Shared access policies.

***

### maxConcurrentCalls?

> `optional` **maxConcurrentCalls?**: `number`

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:27](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L27)

Maximum number of concurrent message handlers per subscription.
Default: 1

***

### mode?

> `optional` **mode?**: `"topic"` \| `"queue"`

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:32](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L32)

Mode of operation: 'topic' (publish/subscribe) or 'queue' (point-to-point).
Default: 'topic'

***

### queuePrefix?

> `optional` **queuePrefix?**: `string`

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:38](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L38)

Prefix to add to all queue names when `mode: 'queue'`.
If not set, `topicPrefix` is used.

***

### subscriptionPrefix?

> `optional` **subscriptionPrefix?**: `string`

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L21)

Prefix to add to all subscription names.
Default: 'cap-sub-'

***

### topicPrefix?

> `optional` **topicPrefix?**: `string`

Defined in: [transport-azure-servicebus/src/servicebus.config.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-azure-servicebus/src/servicebus.config.ts#L15)

Prefix to add to all topic names.
Default: 'cap-'
