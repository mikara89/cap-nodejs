[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaClientFactory

# Interface: KafkaClientFactory

Defined in: cap-transport-kafka/src/kafka-types.ts:55

## Methods

### admin()

> **admin**(): [`KafkaAdminClient`](KafkaAdminClient.md)

Defined in: cap-transport-kafka/src/kafka-types.ts:58

#### Returns

[`KafkaAdminClient`](KafkaAdminClient.md)

***

### consumer()

> **consumer**(`config`): [`KafkaConsumerClient`](KafkaConsumerClient.md)

Defined in: cap-transport-kafka/src/kafka-types.ts:57

#### Parameters

##### config

[`ConsumerConfig`](ConsumerConfig.md)

#### Returns

[`KafkaConsumerClient`](KafkaConsumerClient.md)

***

### producer()

> **producer**(`config`): [`KafkaProducerClient`](KafkaProducerClient.md)

Defined in: cap-transport-kafka/src/kafka-types.ts:56

#### Parameters

##### config

[`ProducerConfig`](ProducerConfig.md)

#### Returns

[`KafkaProducerClient`](KafkaProducerClient.md)
