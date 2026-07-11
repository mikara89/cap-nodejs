[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqConnection

# Interface: RabbitMqConnection

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:53

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:56

#### Returns

`Promise`\<`void`\>

***

### createChannel()

> **createChannel**(): `Promise`\<[`RabbitMqConsumerChannel`](RabbitMqConsumerChannel.md)\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:54

#### Returns

`Promise`\<[`RabbitMqConsumerChannel`](RabbitMqConsumerChannel.md)\>

***

### createConfirmChannel()

> **createConfirmChannel**(): `Promise`\<[`RabbitMqConfirmChannel`](RabbitMqConfirmChannel.md)\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:55

#### Returns

`Promise`\<[`RabbitMqConfirmChannel`](RabbitMqConfirmChannel.md)\>

***

### on()

> **on**(`event`, `listener`): `this`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:57

#### Parameters

##### event

`string`

##### listener

(...`args`) => `void`

#### Returns

`this`

***

### removeListener()

> **removeListener**(`event`, `listener`): `this`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:58

#### Parameters

##### event

`string`

##### listener

(...`args`) => `void`

#### Returns

`this`
