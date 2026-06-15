[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapBaseMessage

# Interface: CapBaseMessage\<T\>

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:8](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L8)

Core shape every CAP message shares – NEVER mutate these fields in-place;
keep messages immutable.

## Extended by

- [`CapPublishEvent`](CapPublishEvent.md)
- [`CapReceivedEvent`](CapReceivedEvent.md)

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:22](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L22)

Optional key/value headers (trace-id, saga-id, etc.).

***

### id

> **id**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:10](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L10)

Globally unique ID (UUID v4 recommended)

***

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L16)

UTC ISO string set by publisher (not the DB timestamp)

***

### payload

> **payload**: `T`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:19](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L19)

User-defined payload.  Keep it serialisable.

***

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L13)

Logical topic / exchange name, e.g. `user.created`
