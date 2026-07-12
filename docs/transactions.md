# Transactions

CAP supports transaction-aware publishing through the existing `tx` option and
the v2.2 operation context option.

Existing `tx` style:

```ts
await cap.publish('user.created', payload, { tx: em });
```

New `ctx` style:

```ts
await cap.publish('user.created', payload, { ctx: { tx: em } });
```

For MikroORM, `em` is the transactional `EntityManager`.

Transaction manager style:

```ts
await cap.transaction(async (ctx) => {
  await userRepo.create(input, ctx);
  await cap.publish('user.created', payload, { ctx });
});
```

When both are present, `ctx` wins over `tx`.

Explicit `ctx` and `tx` always win over ambient transaction context. Ambient
context from a configured transaction manager or `CapTransactionContext` is
convenience only.

When `tx` or `ctx.tx` is provided, CAP saves the outbox row inside that
transaction and defers broker emit by default. The scheduler dispatches after
commit. Use `immediate: true` only when intentionally attempting broker emit in
the same call:

```ts
await cap.publish('user.created', payload, {
  ctx: { tx: em },
  immediate: true,
});
```

Immediate emit is intentionally not atomic across the database and broker. If
the broker emit fails, CAP keeps the persisted outbox row and marks it for retry
instead of rethrowing from `publish()`.

Deferred scheduler dispatch uses a unique ownership token for each claim
round. First-party durable adapters atomically fence completion and failure by
that token and renew the lease during long broker emits. If ownership is lost,
CAP does not update the outbox row, but it cannot cancel an emit already in
progress. The transactional outbox therefore remains an at-least-once pattern;
consumer-side idempotency is still required.

## Roadmap Relationship

v2.2 provides the transaction context foundation: `CapOperationContext`, `tx`
and `ctx` publish options, optional transaction-manager integration, optional
ambient context, publish storage contract tests, informational storage
capability types, and the primary `savePublish(event, ctx?)` storage API.

v2.3 uses that foundation for Knex, TypeORM, and Prisma storage adapters. v2.2
also introduces reusable publish-storage conformance tests in
`@mikara89/cap-testing`; future adapters must pass the relevant contract suite
for their supported capabilities. Transaction manager integration remains
optional; explicit `ctx` or `tx` passed to `publish()` is still the primary
transaction path.

Storage adapters should implement `savePublish(event, ctx?)` as the primary
transaction-aware persistence API. `savePublishWithTx(event, tx)` remains
deprecated compatibility only.
