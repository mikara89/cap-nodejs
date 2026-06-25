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

## Roadmap Relationship

v2.2 provides the transaction context foundation: `CapOperationContext`, `tx`
and `ctx` publish options, optional transaction-manager integration, and the
primary `savePublish(event, ctx?)` storage API.

v2.3 uses that foundation for planned Knex, TypeORM, and Prisma storage
adapters. v2.2 also introduces reusable publish-storage conformance tests in
`@mikara89/cap-testing`; future v2.3 adapters must pass the relevant contract
suite for their supported capabilities. Transaction manager integration remains
optional; explicit `ctx` or `tx` passed to `publish()` is still the primary
transaction path.

Storage adapters should implement `savePublish(event, ctx?)` as the primary
transaction-aware persistence API. `savePublishWithTx(event, tx)` remains
deprecated compatibility only.
