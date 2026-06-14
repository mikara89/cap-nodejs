[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapPublishEvent

# Interface: CapPublishEvent\<T\>

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:8](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L8)

What the *publisher* hands to CapService.
Storage/transport layers may enrich it, but the core library and
user code see only this contract.

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = `unknown`

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L21)

Optional key/value headers (trace-id, saga-id, etc.).

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`headers`](CapBaseMessage.md#headers)

***

### id

> **id**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:9](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L9)

Globally unique ID (UUID v4 recommended)

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`id`](CapBaseMessage.md#id)

***

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L15)

UTC ISO string set by publisher (not the DB timestamp)

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`occurredAt`](CapBaseMessage.md#occurredat)

***

### payload

> **payload**: `T`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L18)

User-defined payload.  Keep it serialisable.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`payload`](CapBaseMessage.md#payload)

***

### retryCount

> **retryCount**: `number`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:10](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L10)

How many times the publish logic retried this record

***

### status?

> `optional` **status?**: `"published"` \| `"failed"`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:11](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L11)

***

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:12](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L12)

Logical topic / exchange name, e.g. `user.created`

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
