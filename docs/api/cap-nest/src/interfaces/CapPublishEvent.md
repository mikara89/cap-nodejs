[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapPublishEvent

# Interface: CapPublishEvent\<T\>

Defined in: cap-core/dist/models/cap-publish-event.d.ts:4

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: cap-core/dist/models/cap-base-message.d.ts:8

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`headers`](CapBaseMessage.md#headers)

***

### id

> **id**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:4

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`id`](CapBaseMessage.md#id)

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: cap-core/dist/models/cap-publish-event.d.ts:8

***

### lockedBy?

> `optional` **lockedBy?**: `string` \| `null`

Defined in: cap-core/dist/models/cap-publish-event.d.ts:9

***

### lockedUntil?

> `optional` **lockedUntil?**: `Date` \| `null`

Defined in: cap-core/dist/models/cap-publish-event.d.ts:10

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date` \| `null`

Defined in: cap-core/dist/models/cap-publish-event.d.ts:7

***

### occurredAt

> **occurredAt**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:6

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`occurredAt`](CapBaseMessage.md#occurredat)

***

### payload

> **payload**: `T`

Defined in: cap-core/dist/models/cap-base-message.d.ts:7

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`payload`](CapBaseMessage.md#payload)

***

### publishedAt?

> `optional` **publishedAt?**: `Date` \| `null`

Defined in: cap-core/dist/models/cap-publish-event.d.ts:11

***

### retryCount

> **retryCount**: `number`

Defined in: cap-core/dist/models/cap-publish-event.d.ts:5

***

### status

> **status**: [`CapPublishStatus`](../type-aliases/CapPublishStatus.md)

Defined in: cap-core/dist/models/cap-publish-event.d.ts:6

***

### topic

> **topic**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:5

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
