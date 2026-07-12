[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-testing/src](../README.md) / CreateReceivedFixtureOptions

# Interface: CreateReceivedFixtureOptions\<T\>

Defined in: [cap-testing/src/fixtures/messages.ts:16](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L16)

## Extends

- [`CreatePublishFixtureOptions`](CreatePublishFixtureOptions.md)\<`T`\>

## Type Parameters

### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

## Properties

### dedupeKey?

> `optional` **dedupeKey?**: `string`

Defined in: [cap-testing/src/fixtures/messages.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L21)

***

### group?

> `optional` **group?**: `string`

Defined in: [cap-testing/src/fixtures/messages.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L19)

***

### headers?

> `optional` **headers?**: [`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

Defined in: [cap-testing/src/fixtures/messages.ts:13](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L13)

#### Inherited from

[`CreatePublishFixtureOptions`](CreatePublishFixtureOptions.md).[`headers`](CreatePublishFixtureOptions.md#headers)

***

### id?

> `optional` **id?**: `string`

Defined in: [cap-testing/src/fixtures/messages.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L9)

#### Inherited from

[`CreatePublishFixtureOptions`](CreatePublishFixtureOptions.md).[`id`](CreatePublishFixtureOptions.md#id)

***

### messageId?

> `optional` **messageId?**: `string`

Defined in: [cap-testing/src/fixtures/messages.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L20)

***

### occurredAt?

> `optional` **occurredAt?**: `string`

Defined in: [cap-testing/src/fixtures/messages.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L11)

#### Inherited from

[`CreatePublishFixtureOptions`](CreatePublishFixtureOptions.md).[`occurredAt`](CreatePublishFixtureOptions.md#occurredat)

***

### payload?

> `optional` **payload?**: `T`

Defined in: [cap-testing/src/fixtures/messages.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L12)

#### Inherited from

[`CreatePublishFixtureOptions`](CreatePublishFixtureOptions.md).[`payload`](CreatePublishFixtureOptions.md#payload)

***

### topic?

> `optional` **topic?**: `string`

Defined in: [cap-testing/src/fixtures/messages.ts:10](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-testing/src/fixtures/messages.ts#L10)

#### Inherited from

[`CreatePublishFixtureOptions`](CreatePublishFixtureOptions.md).[`topic`](CreatePublishFixtureOptions.md#topic)
