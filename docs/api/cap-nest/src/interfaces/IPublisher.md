[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / IPublisher

# Interface: IPublisher

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L16)

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:17](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L17)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### metadata?

[`CapPublishMetadata`](CapPublishMetadata.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:24](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L24)

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
