[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapBaseMessage

# Interface: CapBaseMessage\<T\>

Defined in: cap-core/dist/models/cap-base-message.d.ts:3

## Extended by

- [`CapReceivedEvent`](CapReceivedEvent.md)
- [`CapPublishEvent`](CapPublishEvent.md)

## Type Parameters

### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

### headers?

> `optional` **headers?**: [`CapHeaders`](../type-aliases/CapHeaders.md)

Defined in: cap-core/dist/models/cap-base-message.d.ts:8

***

### id

> **id**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:4

***

### occurredAt

> **occurredAt**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:6

***

### payload

> **payload**: `T`

Defined in: cap-core/dist/models/cap-base-message.d.ts:7

***

### topic

> **topic**: `string`

Defined in: cap-core/dist/models/cap-base-message.d.ts:5
