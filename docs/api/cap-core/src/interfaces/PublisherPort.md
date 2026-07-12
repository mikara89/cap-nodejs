[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / PublisherPort

# Interface: PublisherPort

Defined in: [cap-core/src/ports/publisher.port.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publisher.port.ts#L12)

## Methods

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/publisher.port.ts:13](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publisher.port.ts#L13)

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../type-aliases/JsonValue.md) = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### headers?

[`CapHeaders`](../type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [cap-core/src/ports/publisher.port.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/publisher.port.ts#L20)

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
