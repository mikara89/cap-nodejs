[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapBaseMessage

# Interface: CapBaseMessage\<T\>

Defined in: [cap-core/src/models/cap-base-message.ts:7](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L7)

Core shape every CAP message shares. Keep messages immutable once created.

## Extended by

- [`CapPublishEvent`](CapPublishEvent.md)
- [`CapReceivedEvent`](CapReceivedEvent.md)

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-core/src/models/cap-base-message.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L21)

Optional key/value headers such as trace-id or saga-id.

***

### id

> **id**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L9)

Globally unique ID (UUID v4 recommended).

***

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L15)

UTC ISO string set by publisher, not the DB timestamp.

***

### payload

> **payload**: `T`

Defined in: [cap-core/src/models/cap-base-message.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L18)

User-defined payload. Keep it serializable.

***

### topic

> **topic**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L12)

Logical topic / exchange name, e.g. `user.created`.
