[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / SubscriberPort

# Interface: SubscriberPort

Defined in: [cap-core/src/ports/subscriber.port.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/subscriber.port.ts#L17)

## Methods

### close()?

> `optional` **close**(): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/subscriber.port.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/subscriber.port.ts#L21)

#### Returns

`Promise`\<`void`\>

***

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/subscriber.port.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/subscriber.port.ts#L18)

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

[`CapHandler`](../type-aliases/CapHandler.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/subscriber.port.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/subscriber.port.ts#L20)

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
