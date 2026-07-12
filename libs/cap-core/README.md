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
