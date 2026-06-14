[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / IPublisher

# Interface: IPublisher

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:6](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L6)

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`, `tx?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:7](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L7)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### tx?

`unknown`

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:14](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L14)

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
