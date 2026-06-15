[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapPublishEvent

# Interface: CapPublishEvent\<T\>

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L16)

What the *publisher* hands to CapService.
Storage/transport layers may enrich it, but the core library and
user code see only this contract.

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:22](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L22)

Optional key/value headers (trace-id, saga-id, etc.).

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`headers`](CapBaseMessage.md#headers)

***

### id

> **id**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:10](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L10)

Globally unique ID (UUID v4 recommended)

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`id`](CapBaseMessage.md#id)

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L21)

***

### lockedBy?

> `optional` **lockedBy?**: `string` \| `null`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:22](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L22)

***

### lockedUntil?

> `optional` **lockedUntil?**: `Date` \| `null`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:23](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L23)

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date` \| `null`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:20](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L20)

***

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L16)

UTC ISO string set by publisher (not the DB timestamp)

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`occurredAt`](CapBaseMessage.md#occurredat)

***

### payload

> **payload**: `T`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:19](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L19)

User-defined payload.  Keep it serialisable.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`payload`](CapBaseMessage.md#payload)

***

### publishedAt?

> `optional` **publishedAt?**: `Date` \| `null`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:24](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L24)

***

### retryCount

> **retryCount**: `number`

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L18)

How many times the publish logic retried this record

***

### status

> **status**: [`CapPublishStatus`](../type-aliases/CapPublishStatus.md)

Defined in: [cap-nest/src/cap/models/cap-publish-event.ts:19](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-publish-event.ts#L19)

***

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L13)

Logical topic / exchange name, e.g. `user.created`

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
