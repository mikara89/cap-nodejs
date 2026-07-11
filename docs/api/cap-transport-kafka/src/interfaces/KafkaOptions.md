[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaOptions

# Interface: KafkaOptions

Defined in: cap-transport-kafka/src/kafka-options.ts:15

## Properties

### autoCreateTopics?

> `optional` **autoCreateTopics?**: `boolean`

Defined in: cap-transport-kafka/src/kafka-options.ts:26

***

### brokers?

> `optional` **brokers?**: `string`[]

Defined in: cap-transport-kafka/src/kafka-options.ts:17

***

### clientId?

> `optional` **clientId?**: `string`

Defined in: cap-transport-kafka/src/kafka-options.ts:16

***

### consumer?

> `optional` **consumer?**: `Omit`\<[`ConsumerConfig`](ConsumerConfig.md), `"allowAutoTopicCreation"` \| `"groupId"` \| `"autoCommit"`\>

Defined in: cap-transport-kafka/src/kafka-options.ts:22

***

### factory?

> `optional` **factory?**: [`KafkaFactory`](../type-aliases/KafkaFactory.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:29

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:30

***

### producer?

> `optional` **producer?**: `Omit`\<[`ProducerConfig`](ProducerConfig.md), `"allowAutoTopicCreation"`\>

Defined in: cap-transport-kafka/src/kafka-options.ts:21

***

### publishTimeoutMs?

> `optional` **publishTimeoutMs?**: `number`

Defined in: cap-transport-kafka/src/kafka-options.ts:28

***

### sasl?

> `optional` **sasl?**: [`SASLOptions`](../type-aliases/SASLOptions.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:19

***

### ssl?

> `optional` **ssl?**: `boolean`

Defined in: cap-transport-kafka/src/kafka-options.ts:18

***

### topicCreation?

> `optional` **topicCreation?**: [`KafkaTopicCreationOptions`](KafkaTopicCreationOptions.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:27

***

### topicPrefix?

> `optional` **topicPrefix?**: `string`

Defined in: cap-transport-kafka/src/kafka-options.ts:20
