[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-testing/src](../README.md) / FakePublisher

# Class: FakePublisher

Defined in: cap-core/dist/testing/fake-publisher.d.ts:4

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new FakePublisher**(): `FakePublisher`

#### Returns

`FakePublisher`

## Properties

### emitted

> `readonly` **emitted**: `object`[]

Defined in: cap-core/dist/testing/fake-publisher.d.ts:5

#### headers?

> `optional` **headers?**: [`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

#### metadata?

> `optional` **metadata?**: [`PublishMetadata`](../../../cap-nest/src/interfaces/PublishMetadata.md)

#### payload

> **payload**: `unknown`

#### topic

> **topic**: `string`

***

### error?

> `optional` **error?**: `Error`

Defined in: cap-core/dist/testing/fake-publisher.d.ts:11

## Methods

### emit()

> **emit**\<`T`\>(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-core/dist/testing/fake-publisher.d.ts:12

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

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`emit`](../../../cap-nest/src/interfaces/PublisherPort.md#emit)
