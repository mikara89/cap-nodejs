[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapReceivedEvent

# Interface: CapReceivedEvent\<T\>

Defined in: [cap-core/src/models/cap-received-event.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L14)

Message as observed on the subscriber side, after inbox persistence.

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### dedupeKey

> **dedupeKey**: `string`

Defined in: [cap-core/src/models/cap-received-event.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L22)

Stable dedupe key; defaults to `${topic}|${group}|${messageId}`.

***

### group

> **group**: `string`

Defined in: [cap-core/src/models/cap-received-event.ts:16](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L16)

Consumer group or queue that received the delivery.

***

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: [cap-core/src/models/cap-base-message.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L21)

Optional key/value headers such as trace-id or saga-id.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`headers`](CapBaseMessage.md#headers)

***

### id

> **id**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:9](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L9)

Globally unique ID (UUID v4 recommended).

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`id`](CapBaseMessage.md#id)

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: [cap-core/src/models/cap-received-event.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L34)

Last handler error message, if processing failed.

***

### messageId

> **messageId**: `string`

Defined in: [cap-core/src/models/cap-received-event.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L19)

Broker/source message id used for inbox deduplication.

***

### nextRetry

> **nextRetry**: `Date` \| `null`

Defined in: [cap-core/src/models/cap-received-event.ts:43](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L43)

When this message becomes eligible for the next retry.
null means the first attempt is still pending or the message is terminal.

***

### occurredAt

> **occurredAt**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L15)

UTC ISO string set by publisher, not the DB timestamp.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`occurredAt`](CapBaseMessage.md#occurredat)

***

### payload

> **payload**: `T`

Defined in: [cap-core/src/models/cap-base-message.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L18)

User-defined payload. Keep it serializable.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`payload`](CapBaseMessage.md#payload)

***

### processed

> **processed**: `boolean`

Defined in: [cap-core/src/models/cap-received-event.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L31)

True when handler completed successfully.

***

### processedAt?

> `optional` **processedAt?**: `Date` \| `null`

Defined in: [cap-core/src/models/cap-received-event.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L37)

When the handler completed successfully.

***

### retryCount

> **retryCount**: `number`

Defined in: [cap-core/src/models/cap-received-event.ts:25](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L25)

How many handler attempts so far.

***

### status

> **status**: [`CapReceivedStatus`](../type-aliases/CapReceivedStatus.md)

Defined in: [cap-core/src/models/cap-received-event.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-received-event.ts#L28)

Current inbox processing state.

***

### topic

> **topic**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L12)

Logical topic / exchange name, e.g. `user.created`.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
