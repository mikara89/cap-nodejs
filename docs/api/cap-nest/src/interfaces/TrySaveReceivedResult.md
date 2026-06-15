[**CAP for NestJS API**](../../../README.md)

---

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / TrySaveReceivedResult

# Interface: TrySaveReceivedResult\<T\>

Result returned by inbox idempotent insert.

## Properties

### inserted

> **inserted**: `boolean`

Whether this delivery inserted a new inbox row.

---

### id

> **id**: `string`

Inbox row id for the inserted or existing delivery.

---

### event

> **event**: [`CapReceivedEvent`](CapReceivedEvent.md)\<`T`\>

Inbox event for the inserted or existing delivery.
