[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / ResolvedKafkaOptions

# Interface: ResolvedKafkaOptions

Defined in: cap-transport-kafka/src/kafka-options.ts:33

## Properties

### autoCreateTopics

> **autoCreateTopics**: `boolean`

Defined in: cap-transport-kafka/src/kafka-options.ts:44

***

### brokers

> **brokers**: `string`[]

Defined in: cap-transport-kafka/src/kafka-options.ts:35

***

### clientId

> **clientId**: `string`

Defined in: cap-transport-kafka/src/kafka-options.ts:34

***

### consumer

> **consumer**: `Omit`\<[`ConsumerConfig`](ConsumerConfig.md), `"groupId"` \| `"autoCommit"` \| `"allowAutoTopicCreation"`\>

Defined in: cap-transport-kafka/src/kafka-options.ts:40

***

### factory

> **factory**: [`KafkaFactory`](../type-aliases/KafkaFactory.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:50

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:51

***

### producer

> **producer**: `Omit`\<[`ProducerConfig`](ProducerConfig.md), `"allowAutoTopicCreation"`\>

Defined in: cap-transport-kafka/src/kafka-options.ts:39

***

### publishTimeoutMs

> **publishTimeoutMs**: `number`

Defined in: cap-transport-kafka/src/kafka-options.ts:49

***

### sasl?

> `optional` **sasl?**: [`SASLOptions`](../type-aliases/SASLOptions.md)

Defined in: cap-transport-kafka/src/kafka-options.ts:37

***

### ssl?

> `optional` **ssl?**: `boolean`

Defined in: cap-transport-kafka/src/kafka-options.ts:36

***

### topicCreation

> **topicCreation**: `Required`\<`Pick`\<[`KafkaTopicCreationOptions`](KafkaTopicCreationOptions.md), `"partitions"` \| `"replicationFactor"`\>\> & `Pick`\<[`KafkaTopicCreationOptions`](KafkaTopicCreationOptions.md), `"config"`\>

Defined in: cap-transport-kafka/src/kafka-options.ts:45

***

### topicPrefix

> **topicPrefix**: `string`

Defined in: cap-transport-kafka/src/kafka-options.ts:38
