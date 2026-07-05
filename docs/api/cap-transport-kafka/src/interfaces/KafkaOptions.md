[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaOptions

# Interface: KafkaOptions

Defined in: [cap-transport-kafka/src/kafka-options.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L15)

## Properties

### autoCreateTopics?

> `optional` **autoCreateTopics?**: `boolean`

Defined in: [cap-transport-kafka/src/kafka-options.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L26)

***

### brokers?

> `optional` **brokers?**: `string`[]

Defined in: [cap-transport-kafka/src/kafka-options.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L17)

***

### clientId?

> `optional` **clientId?**: `string`

Defined in: [cap-transport-kafka/src/kafka-options.ts:16](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L16)

***

### consumer?

> `optional` **consumer?**: `Omit`\<[`ConsumerConfig`](ConsumerConfig.md), `"allowAutoTopicCreation"` \| `"groupId"` \| `"autoCommit"`\>

Defined in: [cap-transport-kafka/src/kafka-options.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L22)

***

### factory?

> `optional` **factory?**: [`KafkaFactory`](../type-aliases/KafkaFactory.md)

Defined in: [cap-transport-kafka/src/kafka-options.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L29)

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: [cap-transport-kafka/src/kafka-options.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L30)

***

### producer?

> `optional` **producer?**: `Omit`\<[`ProducerConfig`](ProducerConfig.md), `"allowAutoTopicCreation"`\>

Defined in: [cap-transport-kafka/src/kafka-options.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L21)

***

### publishTimeoutMs?

> `optional` **publishTimeoutMs?**: `number`

Defined in: [cap-transport-kafka/src/kafka-options.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L28)

***

### sasl?

> `optional` **sasl?**: [`SASLOptions`](../type-aliases/SASLOptions.md)

Defined in: [cap-transport-kafka/src/kafka-options.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L19)

***

### ssl?

> `optional` **ssl?**: `boolean`

Defined in: [cap-transport-kafka/src/kafka-options.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L18)

***

### topicCreation?

> `optional` **topicCreation?**: [`KafkaTopicCreationOptions`](KafkaTopicCreationOptions.md)

Defined in: [cap-transport-kafka/src/kafka-options.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L27)

***

### topicPrefix?

> `optional` **topicPrefix?**: `string`

Defined in: [cap-transport-kafka/src/kafka-options.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-options.ts#L20)
