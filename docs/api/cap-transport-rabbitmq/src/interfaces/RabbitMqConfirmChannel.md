[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqConfirmChannel

# Interface: RabbitMqConfirmChannel

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:9

## Extends

- `RabbitMqEventSource`

## Methods

### assertExchange()

> **assertExchange**(`exchange`, `type`, `options?`): `Promise`\<`AssertExchange`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:10

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

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:22

#### Returns

`Promise`\<`void`\>

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

### publish()

> **publish**(`exchange`, `routingKey`, `content`, `options`, `callback`): `boolean`

Defined in: cap-transport-rabbitmq/src/rabbitmq-types.ts:15

#### Parameters

##### exchange

`string`

##### routingKey

`string`

##### content

`Buffer`

##### options

`Publish`

##### callback

(`error`, `ok?`) => `void`

#### Returns

`boolean`

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
