[**CAP for NestJS API**](../../../README.md)

---

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / MarkReceivedFailedOptions

# Interface: MarkReceivedFailedOptions

Options passed when marking an inbox delivery as failed.

## Properties

### maxRetries

> **maxRetries**: `number`

Maximum handler attempts before moving the record to `dead_letter`.

---

### nextRetryAt

> **nextRetryAt**: `Date`

Next retry timestamp when the failure remains retryable.

---

### now

> **now**: `Date`

Current timestamp used for storage updates.
