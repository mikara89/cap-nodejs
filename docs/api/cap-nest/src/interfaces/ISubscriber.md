[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / ISubscriber

# Interface: ISubscriber

Defined in: cap-nest/src/cap/abstractions/transport.interface.ts:31

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: cap-nest/src/cap/abstractions/transport.interface.ts:32

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

Defined in: cap-nest/src/cap/abstractions/transport.interface.ts:42

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
