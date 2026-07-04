[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-testing/src](../README.md) / TransportContractPublisher

# Interface: TransportContractPublisher

Defined in: [cap-testing/src/contracts/transport-contract.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L32)

## Extends

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Methods

### close()?

> `optional` **close**(): `Promise`\<`void`\>

Defined in: [cap-testing/src/contracts/transport-contract.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/contracts/transport-contract.ts#L34)

Adapter extension; PublisherPort does not currently define disposal.

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publisher.port.d.ts:10

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](../../../cap-nest/src/interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`emit`](../../../cap-nest/src/interfaces/PublisherPort.md#emit)

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/publisher.port.d.ts:11

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`initialize`](../../../cap-nest/src/interfaces/PublisherPort.md#initialize)
