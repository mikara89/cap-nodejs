[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapReceivedEvent

# Interface: CapReceivedEvent\<T\>

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:14](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L14)

Message as observed on the subscriber side, AFTER persistence.

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### dedupeKey

> **dedupeKey**: `string`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:22](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L22)

Stable dedupe key; defaults to `${topic}|${group}|${messageId}`.

***

### group

> **group**: `string`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L16)

Consumer-group (queue) that received the delivery

***

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

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:34](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L34)

Last handler error message, if processing failed.

***

### messageId

> **messageId**: `string`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:19](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L19)

Broker/source message id used for inbox deduplication.

***

### nextRetry

> **nextRetry**: `Date` \| `null`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:44](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L44)

When this message becomes eligible for the next retry.
 • `null`  – first attempt still pending
 • Date    – retry after that instant

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

### processed

> **processed**: `boolean`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:31](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L31)

true when handler completed successfully

***

### processedAt?

> `optional` **processedAt?**: `Date` \| `null`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:37](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L37)

When the handler completed successfully.

***

### retryCount

> **retryCount**: `number`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:25](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L25)

How many handler attempts so far

***

### status

> **status**: [`CapReceivedStatus`](../type-aliases/CapReceivedStatus.md)

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:28](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L28)

Current inbox processing state.

***

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L13)

Logical topic / exchange name, e.g. `user.created`

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
