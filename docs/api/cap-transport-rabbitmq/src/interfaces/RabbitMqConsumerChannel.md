[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqConsumerChannel

# Interface: RabbitMqConsumerChannel

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:25

## Extends

- `RabbitMqEventSource`

## Methods

### ack()

> **ack**(`message`, `allUpTo?`): `void`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:48

#### Parameters

##### message

`ConsumeMessage`

##### allUpTo?

`boolean`

#### Returns

`void`

***

### assertExchange()

> **assertExchange**(`exchange`, `type`, `options?`): `Promise`\<`AssertExchange`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:26

#### Parameters

##### exchange

`string`

##### type

`string`

##### options?

`AssertExchange`

#### Returns

`Promise`\<`AssertExchange`\>

***

### assertQueue()

> **assertQueue**(`queue`, `options?`): `Promise`\<`AssertQueue`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:31

#### Parameters

##### queue

`string`

##### options?

`AssertQueue`

#### Returns

`Promise`\<`AssertQueue`\>

***

### bindQueue()

> **bindQueue**(`queue`, `source`, `pattern`, `args?`): `Promise`\<`Empty`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:35

#### Parameters

##### queue

`string`

##### source

`string`

##### pattern

`string`

##### args?

`unknown`

#### Returns

`Promise`\<`Empty`\>

***

### cancel()

> **cancel**(`consumerTag`): `Promise`\<`Empty`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:47

#### Parameters

##### consumerTag

`string`

#### Returns

`Promise`\<`Empty`\>

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:50

#### Returns

`Promise`\<`void`\>

***

### consume()

> **consume**(`queue`, `callback`, `options?`): `Promise`\<`Consume`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:42

#### Parameters

##### queue

`string`

##### callback

(`message`) => `void`

##### options?

`Consume`

#### Returns

`Promise`\<`Consume`\>

***

### nack()

> **nack**(`message`, `allUpTo?`, `requeue?`): `void`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:49

#### Parameters

##### message

`ConsumeMessage`

##### allUpTo?

`boolean`

##### requeue?

`boolean`

#### Returns

`void`

***

### on()

> **on**(`event`, `listener`): `this`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:4

#### Parameters

##### event

`string`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`RabbitMqEventSource.on`

***

### once()

> **once**(`event`, `listener`): `this`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:5

#### Parameters

##### event

`string`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`RabbitMqEventSource.once`

***

### prefetch()

> **prefetch**(`count`, `global?`): `Promise`\<`Empty`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:41

#### Parameters

##### count

`number`

##### global?

`boolean`

#### Returns

`Promise`\<`Empty`\>

***

### removeListener()

> **removeListener**(`event`, `listener`): `this`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:6

#### Parameters

##### event

`string`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`RabbitMqEventSource.removeListener`
