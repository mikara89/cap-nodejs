[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / ISubscriber

# Interface: ISubscriber

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:27](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L27)

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:28](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L28)

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

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:38](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L38)

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
