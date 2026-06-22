[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapReceivedEvent

# Interface: CapReceivedEvent\<T\>

Defined in: cap-core/dist/models/cap-received-event.d.ts:4

## Extends

- [`CapBaseMessage`](CapBaseMessage.md)\<`T`\>

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### dedupeKey

> **dedupeKey**: `string`

Defined in: cap-core/dist/models/cap-received-event.d.ts:7

***

### group

> **group**: `string`

Defined in: cap-core/dist/models/cap-received-event.d.ts:5

***

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

Defined in: cap-core/dist/models/cap-received-event.d.ts:11

***

### messageId

> **messageId**: `string`

Defined in: cap-core/dist/models/cap-received-event.d.ts:6

***

### nextRetry

> **nextRetry**: `Date` \| `null`

Defined in: cap-core/dist/models/cap-received-event.d.ts:13

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

### processed

> **processed**: `boolean`

Defined in: cap-core/dist/models/cap-received-event.d.ts:10

***

### processedAt?

> `optional` **processedAt?**: `Date` \| `null`

Defined in: cap-core/dist/models/cap-received-event.d.ts:12

***

### retryCount

> **retryCount**: `number`

Defined in: cap-core/dist/models/cap-received-event.d.ts:8

***

### status

> **status**: [`CapReceivedStatus`](../type-aliases/CapReceivedStatus.md)

Defined in: cap-core/dist/models/cap-received-event.d.ts:9

***

### topic

> **topic**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:5

#### Inherited from

[`CapBaseMessage`](CapBaseMessage.md).[`topic`](CapBaseMessage.md#topic)
