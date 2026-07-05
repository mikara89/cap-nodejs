[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaPublisher

# Class: KafkaPublisher

Defined in: [cap-transport-kafka/src/kafka-publisher.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-publisher.ts#L27)

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new KafkaPublisher**(`options?`): `KafkaPublisher`

Defined in: [cap-transport-kafka/src/kafka-publisher.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-publisher.ts#L34)

#### Parameters

##### options?

[`KafkaOptions`](../interfaces/KafkaOptions.md) = `{}`

#### Returns

`KafkaPublisher`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-publisher.ts:89](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-publisher.ts#L89)

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-publisher.ts:62](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-publisher.ts#L62)

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

Defined in: [cap-transport-kafka/src/kafka-publisher.ts:40](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-publisher.ts#L40)

#### Parameters

##### \_options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`initialize`](../../../cap-nest/src/interfaces/PublisherPort.md#initialize)
