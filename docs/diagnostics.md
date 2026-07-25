# Messaging diagnostics

`@mikara89/cap-core` can emit optional, framework-neutral, best-effort
operational notifications for durable inbox and outbox transitions. Configure a
`CapMessagingDiagnosticsPort` when constructing `CapEngine`, or pass the same
object as `diagnostics` to `CapModule.forRoot`, `forRootAsync`, or
`forInMemory`.

```ts
import {
  type CapMessagingDiagnosticsPort,
  CapEngine,
} from '@mikara89/cap-core';

const diagnostics: CapMessagingDiagnosticsPort = {
  emit(event) {
    console.log(event.type, event.id, event.at);
  },
};

const engine = new CapEngine({
  publishStorage,
  receivedStorage,
  publisher,
  subscriber,
  diagnostics,
});
```

The port is optional. CAP messaging works normally when it is not configured.
The core has no dependency on NestJS, a transport, an ORM, a logging framework,
OpenTelemetry, or Node's `diagnostics_channel`.

## Privacy boundary

**CAP messaging diagnostics intentionally exclude message payloads and headers
by default.** Events contain only operational metadata and normalized error
text. This makes the default events suitable for typical logging, tracing, and
monitoring sinks without copying business data, credentials, or authorization
values. This release has no option to enable payload or header capture.

## Event model

Every event has `type`, `id`, `topic`, `at` (an ISO-8601 UTC timestamp), and
`retryCount`. Inbox events additionally have `direction: 'inbox'`, `group`, and
`messageId`; outbox events have `direction: 'outbox'`.

| Event                      | Extra fields                          | Emitted after                                                    |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `inbox.processed`          | —                                     | `markProcessed()` succeeds                                       |
| `inbox.failed`             | `error`, `nextRetryAt`                | `markReceivedFailed()` stores a retryable failure                |
| `inbox.dead_lettered`      | `error`, `nextRetryAt: null`          | `markReceivedFailed()` stores a terminal failure                 |
| `inbox.retried`            | `reason: 'failed' \| 'stale_pending'` | the scheduler begins a registered handler invocation             |
| `inbox.manually_requeued`  | optional `previousStatus`             | a durable inbox requeue succeeds                                 |
| `outbox.published`         | —                                     | `markPublished()` succeeds                                       |
| `outbox.failed`            | `error`, `nextRetryAt`                | `markPublishFailed()` stores a retryable failure                 |
| `outbox.dead_lettered`     | `error`, `nextRetryAt: null`          | `markPublishFailed()` stores a terminal failure                  |
| `outbox.retried`           | —                                     | a claimed scheduler row with `retryCount > 0` begins broker work |
| `outbox.manually_requeued` | optional `previousStatus`             | a durable outbox requeue succeeds                                |

Failure retry counts are the count after the durable failure transition.
`error` is CAP's normalized error string, never the original error object or a
stack trace. Transition timestamps reuse the corresponding processing,
failure, publish, requeue, or scheduler-attempt clock value.

`inbox.retried` is not emitted for a missing registered handler or when the
scheduler is disabled. A stale pending row is reported as `stale_pending`; due
failed rows, including manually requeued inbox rows, are reported as `failed`.
Outbox claim changes status to `processing`, so an outbox retry is emitted only
when its existing `retryCount` proves a prior attempt. Manual outbox requeue
resets that count to zero: it can therefore be followed by `outbox.published`
without an `outbox.retried` event.

## Delivery and failure semantics

Diagnostics are **best-effort operational notifications**, not a second message
bus or a durable audit log. They provide no persistence, replay, exactly-once
delivery, cross-sink ordering, process-termination delivery, or transactional
consistency guarantee. Use durable storage or dedicated audit infrastructure
when those guarantees are required.

CAP does not await an asynchronous sink on the messaging path. A slow sink
cannot delay broker publishing, subscriber completion, scheduler progression,
or manual requeue completion. A synchronous throw or returned rejected promise
is logged through the configured CAP logger and swallowed. It cannot change
message state, retry/dead-letter behavior, broker settlement, or a requeue
result.
