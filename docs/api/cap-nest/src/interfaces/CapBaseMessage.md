[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapBaseMessage

# Interface: CapBaseMessage\<T\>

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:7](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L7)

Core shape every CAP message shares – NEVER mutate these fields in-place;
keep messages immutable.

## Extended by

- [`CapPublishEvent`](CapPublishEvent.md)
- [`CapReceivedEvent`](CapReceivedEvent.md)

## Type Parameters

### T

`T` = `unknown`

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L21)

Optional key/value headers (trace-id, saga-id, etc.).

***

### id

> **id**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:9](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L9)

Globally unique ID (UUID v4 recommended)

***

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L15)

UTC ISO string set by publisher (not the DB timestamp)

***

### payload

> **payload**: `T`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L18)

User-defined payload.  Keep it serialisable.

***

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:12](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L12)

Logical topic / exchange name, e.g. `user.created`
