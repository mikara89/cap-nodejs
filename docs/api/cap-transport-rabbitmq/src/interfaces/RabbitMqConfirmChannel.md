[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-transport-rabbitmq/src](../README.md) / RabbitMqConfirmChannel

# Interface: RabbitMqConfirmChannel

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L9)

## Extends

- `RabbitMqEventSource`

## Methods

### assertExchange()

> **assertExchange**(`exchange`, `type`, `options?`): `Promise`\<`AssertExchange`\>

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:10](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L10)

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

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L22)

#### Returns

`Promise`\<`void`\>

***

### on()

> **on**(`event`, `listener`): `this`

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:4](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L4)

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

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:5](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L5)

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

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L15)

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

Defined in: [cap-transport-rabbitmq/src/rabbitmq-types.ts:6](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-transport-rabbitmq/src/rabbitmq-types.ts#L6)

#### Parameters

##### event

`string`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`RabbitMqEventSource.removeListener`
