# @mikara89/cap-core

Framework-agnostic CAP engine, models, ports, utilities, scheduler, and
in-memory testing adapters.

Use this package directly when building non-Nest adapters, workers, tests, or
custom framework integrations.

```ts
import { CapEngine } from '@mikara89/cap-core';

const engine = new CapEngine({
  publishStorage,
  receivedStorage,
  publisher,
  subscriber,
});
```

NestJS users can continue importing compatible CAP types through
`@mikara89/cap-nest`.

## Versioned Message Envelopes

CAP normally sends the business payload as the broker body and carries headers
and message identity through native transport metadata. Use a body envelope
only for a custom transport or bridge that cannot carry CAP headers separately,
or when an external producer intentionally creates a CAP-compatible body:

```ts
import { createCapMessageEnvelope } from '@mikara89/cap-core';

const message = createCapMessageEnvelope(
  { orderId: 'o1' },
  { traceId: 'trace-1' },
);
```

The stable version-1 JSON contract is:

```json
{
  "$cap": { "kind": "cap.message", "version": 1 },
  "payload": { "orderId": "o1" },
  "headers": { "traceId": "trace-1" }
}
```

Inbound decoding requires the exact marker, supported version, an own
`payload`, and valid optional headers. Native transport headers are merged over
envelope headers. Transport `messageId` metadata remains authoritative, then
the decoded `cap-message-id` header, then CAP's generated fallback. Unsupported
versions and malformed explicit CAP envelopes throw typed errors before inbox
persistence or handler invocation.

Legacy unversioned `{ payload, headers? }` bodies are recognized only when
those are their only enumerable keys. `messageEnvelope.legacyUnversioned`
supports `accept`, `warn`, or `reject`; the default is `warn`, once per engine.
New body wrappers should always use `createCapMessageEnvelope()`. Ordinary
business objects such as `{ payload, source, type }` remain intact.

```ts
const engine = new CapEngine({
  // ...ports
  messageEnvelope: { legacyUnversioned: 'reject' },
});
```

Outbox rows continue storing the original business payload and headers in their
existing fields. CAP does not globally wrap native-header transport bodies.

## Subscription Lifecycle

Registration and broker attachment are separate operations. Register handlers
first; registration is synchronous and performs no broker I/O. Then explicitly
await startup so the process does not report itself ready before its consumers
are attached:

```ts
engine.registerSubscription('user.created', 'mail-service', async (payload) =>
  sendWelcomeEmail(payload),
);

await engine.startSubscriptions();
```

`startSubscriptions()` resolves only after every initial
`SubscriberPort.consume()` call has resolved. It rejects with the failing topic
and group when attachment fails. Concurrent starts share one operation, and a
successful repeated start is idempotent. After a partial failure, calling it
again retries registrations that are still unattached without duplicating
successful attachments.

`getSubscriptionLifecycle()` reports `idle`, `starting`, `ready`, `failed`,
`stopping`, or `stopped`, plus registration and attachment counts and the most
recent attachment failure. Use `subscribe()` only for intentional dynamic
registration and immediate attachment after startup.

For graceful shutdown, await `stopSubscriptions()` or `close()`. Shutdown is
safe after partial startup, concurrent stops are deduplicated, and a start
requested during shutdown waits for shutdown before attaching a fresh consumer
cycle. Registrations remain available for restart.

## Transaction Context

Existing transaction-handle publishing remains supported:

```ts
await cap.publish('user.created', payload, { tx: em });
```

New code can pass a CAP operation context:

```ts
await cap.publish('user.created', payload, { ctx: { tx: em } });
```

If a `CapTransactionManagerPort` is configured, use `transaction()` to run work
with a manager-provided context:

```ts
await cap.transaction(async (ctx) => {
  await userRepo.create(input, ctx);
  await cap.publish('user.created', payload, { ctx });
});
```

Explicit `ctx` and `tx` always win over ambient transaction context. Ambient
context from a transaction manager or `CapTransactionContext` is convenience
only.

When `tx` or `ctx.tx` is provided, CAP saves the outbox row inside that
transaction and defers broker emit by default. The scheduler dispatches after
commit. Use `immediate: true` only when intentionally attempting broker emit in
the same call.

## Storage Capabilities

`CapStorageCapabilities` and `CapabilityAwareStoragePort` let storage adapters
report informational behavior such as transaction support, safe skip-locked
claiming, ownership-fenced completion, active lease renewal, and supported
isolation levels. CAP core does not enforce these
capabilities at startup in v2.2.

Scheduler claims use an opaque token unique to every dispatch round. When a
storage implements `renewPublishClaim`, CAP renews immediately before emit and
while the broker call is active. Fenced completion prevents stale workers from
updating reclaimed rows. This narrows duplicate windows but does not change the
outbox guarantee: broker delivery is at least once, so handlers must remain
idempotent.
