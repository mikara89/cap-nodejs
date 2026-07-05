[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / PublisherPort

# Interface: PublisherPort

Defined in: cap-core/dist/ports/publisher.port.d.ts:9

## Extended by

- [`TransportContractPublisher`](../../../cap-testing/src/interfaces/TransportContractPublisher.md)

## Methods

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publisher.port.d.ts:10

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

Defined in: cap-core/dist/ports/publisher.port.d.ts:11

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>
