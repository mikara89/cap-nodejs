[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-kafka/src](../README.md) / KafkaConsumerClient

# Interface: KafkaConsumerClient

Defined in: [cap-transport-kafka/src/kafka-types.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L29)

## Methods

### commitOffsets()

> **commitOffsets**(`offsets`): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L37)

#### Parameters

##### offsets

`object`[]

#### Returns

`Promise`\<`void`\>

***

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L30)

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L31)

#### Returns

`Promise`\<`void`\>

***

### run()

> **run**(`options`): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L34)

#### Parameters

##### options

###### eachMessage

(`payload`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L32)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**(`options`): `Promise`\<`void`\>

Defined in: [cap-transport-kafka/src/kafka-types.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-kafka/src/kafka-types.ts#L33)

#### Parameters

##### options

###### replace?

`boolean`

###### topics

`string`[]

#### Returns

`Promise`\<`void`\>
