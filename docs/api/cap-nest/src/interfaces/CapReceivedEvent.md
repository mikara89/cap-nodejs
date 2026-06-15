[**CAP for NestJS API**](../../../README.md)

---

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapReceivedEvent

# Interface: CapReceivedEvent\<T\>

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:6](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L6)

Message as observed on the subscriber side, AFTER persistence.

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = `unknown`

## Properties

### group

> **group**: `string`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:9](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L9)

Consumer-group (queue) that received the delivery

---

### messageId

> **messageId**: `string`

Broker/source message id used for tracing the delivery.

---

### dedupeKey

> **dedupeKey**: `string`

Stable inbox idempotency key; first-party durable storage deduplicates by group
and dedupeKey.

---

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L21)

Optional key/value headers (trace-id, saga-id, etc.).

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`headers`](CapBaseMessage.md#headers)

---

### id

> **id**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:9](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L9)

Globally unique ID (UUID v4 recommended)

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`id`](CapBaseMessage.md#id)

---

### nextRetry

> **nextRetry**: `Date` \| `null`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:22](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L22)

When this message becomes eligible for the next retry.
• `null` – first attempt still pending
• Date – retry after that instant

---

### lastError?

> `optional` **lastError?**: `string` \| `null`

Last handler error message, if processing failed.

---

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L15)

UTC ISO string set by publisher (not the DB timestamp)

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`occurredAt`](CapBaseMessage.md#occurredat)

---

### payload

> **payload**: `T`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L18)

User-defined payload. Keep it serialisable.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`payload`](CapBaseMessage.md#payload)

---

### processed

> **processed**: `boolean`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L15)

true when handler completed successfully

---

### processedAt?

> `optional` **processedAt?**: `Date` \| `null`

When the handler completed successfully.

---

### retryCount

> **retryCount**: `number`

Defined in: [cap-nest/src/cap/models/cap-received-event.ts:12](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-received-event.ts#L12)

How many handler attempts so far

---

### status

> **status**: `"pending"` \| `"processing"` \| `"processed"` \| `"failed"` \| `"dead_letter"`

Current inbox processing state.

---

### topic

> **topic**: `string`

Defined in: [cap-nest/src/cap/models/cap-base-message.ts:12](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/models/cap-base-message.ts#L12)

Logical topic / exchange name, e.g. `user.created`

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
