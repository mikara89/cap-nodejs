[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / ISubscriber

# Interface: ISubscriber

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L16)

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:17](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L17)

#### Parameters

##### topic

`string`

##### group

`string`

##### onMessage

(`payload`, `headers?`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:23](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L23)

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
