[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / IPublisher

# Interface: IPublisher

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L20)

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L21)

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

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L28)

Optional one-time initialization: create queues/topics if needed

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
