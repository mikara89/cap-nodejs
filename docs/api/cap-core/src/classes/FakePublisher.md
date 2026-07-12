[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / FakePublisher

# Class: FakePublisher

Defined in: [cap-core/src/testing/fake-publisher.ts:8](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-publisher.ts#L8)

## Implements

- [`PublisherPort`](../interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new FakePublisher**(): `FakePublisher`

#### Returns

`FakePublisher`

## Properties

### emitted

> `readonly` **emitted**: `object`[] = `[]`

Defined in: [cap-core/src/testing/fake-publisher.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-publisher.ts#L9)

#### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

#### metadata?

> `optional` **metadata?**: [`PublishMetadata`](../interfaces/PublishMetadata.md)

#### payload

> **payload**: `unknown`

#### topic

> **topic**: `string`

***

### error?

> `optional` **error?**: `Error`

Defined in: [cap-core/src/testing/fake-publisher.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-publisher.ts#L15)

## Methods

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [cap-core/src/testing/fake-publisher.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/testing/fake-publisher.ts#L17)

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

[`PublishMetadata`](../interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../interfaces/PublisherPort.md).[`emit`](../interfaces/PublisherPort.md#emit)
