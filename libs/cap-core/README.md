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
