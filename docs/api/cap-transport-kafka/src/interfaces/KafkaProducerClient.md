[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaProducerClient

# Interface: KafkaProducerClient

Defined in: [cap-transport-kafka/src/kafka-types.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L20)

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L21)

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L22)

#### Returns

`Promise`\<`void`\>

***

### send()

> **send**(`record`): `Promise`\<`RecordMetadata`[]\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:23](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L23)

#### Parameters

##### record

###### messages

`object`[]

###### topic

`string`

#### Returns

`Promise`\<`RecordMetadata`[]\>
