[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / ISubscriber

# Interface: ISubscriber

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L31)

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L32)

#### Parameters

##### topic

`string`

##### group

`string`

##### onMessage

(`payload`, `headers?`, `metadata?`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L42)

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
