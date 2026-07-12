[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapPublishEvent

# Interface: CapPublishEvent\<T\>

Defined in: [cap-core/src/models/cap-publish-event.ts:14](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L14)

Outbox message as seen by CAP core and storage/transport adapters.

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

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

Defined in: [cap-core/src/models/cap-publish-event.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L19)

***

### lockedBy?

> `optional` **lockedBy?**: `string` \| `null`

Defined in: [cap-core/src/models/cap-publish-event.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L20)

***

### lockedUntil?

> `optional` **lockedUntil?**: `Date` \| `null`

Defined in: [cap-core/src/models/cap-publish-event.ts:21](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L21)

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date` \| `null`

Defined in: [cap-core/src/models/cap-publish-event.ts:18](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L18)

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

### publishedAt?

> `optional` **publishedAt?**: `Date` \| `null`

Defined in: [cap-core/src/models/cap-publish-event.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L22)

***

### retryCount

> **retryCount**: `number`

Defined in: [cap-core/src/models/cap-publish-event.ts:16](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L16)

How many times the publish logic retried this record.

***

### status

> **status**: [`CapPublishStatus`](../type-aliases/CapPublishStatus.md)

Defined in: [cap-core/src/models/cap-publish-event.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-publish-event.ts#L17)

***

### topic

> **topic**: `string`

Defined in: [cap-core/src/models/cap-base-message.ts:12](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/models/cap-base-message.ts#L12)

Logical topic / exchange name, e.g. `user.created`.

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
