**Transactional Outbox (Usage & Implementation)**

- **Purpose**: Describe how to use the optional transactional storage capability
  added to the CAP library so adapters (for example, MikroORM) can persist
  outbox records inside an existing database transaction. This document explains
  the new interface, recommended patterns, and examples.

**What changed**:

- **New interface**: `ITransactionalPublishStorage` (in
  `libs/cap-nest/src/cap/abstractions/storage.interface.ts`) — adapters may
  implement:
  - `savePublishWithTx<T = unknown>(evt: CapPublishEvent<T>, tx: unknown): Promise<string>`
- **CapService.publish** now detects at runtime whether the injected publish
  storage implements `savePublishWithTx` and, when a `tx` object is provided,
  prefers the transactional save. This is capability-driven and backwards
  compatible.

**Design goals**:

- Keep backwards compatibility: storages that do not support transactions
  continue to work unchanged.
- Make transactional support opt-in: adapters that support transactions
  implement `savePublishWithTx`.
- Keep semantics explicit: passing a `tx` to `savePublishWithTx` means “persist
  the outbox record in this transaction”.

**Important semantics & recommendations**

- Two distinct concerns exist: (A) persisting the outbox row inside the same DB
  transaction as domain changes (atomicity), and (B) delivering/emitting the
  message to the outside world.
- Best practice for the outbox pattern: persist the outbox row inside the
  transaction and _defer_ actual message emission until after the transaction
  commits (e.g., via a scheduler). Emission before commit can lead to
  inconsistent states if the DB transaction later rolls back.
- The current library provides the capability to persist inside a transaction.
  CapService still calls `publisher.emit(topic, payload, tx)` after persisting.
  If you want strict deferred publishing, either:
  - Persist the outbox entry directly via the storage adapter's
    `savePublishWithTx(...)` inside your transaction and avoid calling
    `CapService.publish(...)` until after commit; or
  - Implement your publisher to detect and skip/queue emission when a `tx` is
    provided (adapter-specific behavior).

**Interfaces**

- `IPublishStorage` (unchanged)
  - `savePublish(evt)`
  - `markPublished(id)`
  - `getUnpublished(limit)`
- `ITransactionalPublishStorage` (new, optional)
  - `savePublishWithTx(evt, tx)` — persists the outbox record using the provided
    transaction/context.

**How to implement in an adapter (MikroORM example)**

- The MikroORM adapter in this repo demonstrates a minimal implementation. Key
  points:
  - The adapter accepts an `EntityManager` as the `tx` argument (the code casts
    `tx` to `EntityManager`).
  - When `savePublishWithTx` is called, the adapter uses the provided
    `EntityManager` to create and persist the outbox entity instead of the
    adapter's top-level `em` instance.

Example (conceptual):

```ts
// inside your MikroORM adapter
async savePublishWithTx(event: CapPublishEvent, tx: unknown): Promise<string> {
  const em = (tx as EntityManager) ?? this.em;
  const entity = em.create(CapPublishEntity, { /* map fields */ });
  await em.persistAndFlush(entity);
  return entity.id;
}
```

**How to use from application code**

- Option 1 — Deferred outbox (recommended): persist inside transaction, let
  scheduler publish
  - Use the ORM transaction wrapper and call the storage adapter directly:
  ```ts
  await orm.em.transactional(async (em) => {
      // do domain changes
      await em.persistAndFlush(myEntity);

      // persist outbox inside the same transaction
      await (publishStorage as ITransactionalPublishStorage).savePublishWithTx(
          evt,
          em,
      );
  });

  // do NOT call publisher.emit inside the transaction; scheduler will pick up unpublished rows
  ```

- Option 2 — Immediate publish (not generally recommended unless transport
  supports transactional sends):
  ```ts
  // this will save inside tx when possible, then call the publisher
  await capService.publish(topic, payload, headers, em);
  ```
  Note: This approach may emit a message before the transaction commits. Use
  only if your transport is safe to do so, or if you implement publisher
  behaviour that defers/ignores emission when `tx` is present.

**Testing guidance**

- The repository includes integration tests that exercise `savePublishWithTx`
  with commit and rollback scenarios using Testcontainers + MikroORM. See
  `libs/storage-mikro-orm/test/storage.integration-spec.ts` for examples.

**Backward compatibility & migration notes**

- Existing adapters and code remain unchanged — `CapService.publish(...)` will
  continue to call `savePublish(...)` when no `tx` is passed, or when the
  adapter does not implement `savePublishWithTx`.
- Adapters that implement the transactional interface should ensure their
  `savePublishWithTx` correctly uses the provided transaction/context object.

**Next steps & recommendations**

- If you rely on strict atomicity between domain changes and outbox persistence,
  use the _Deferred outbox_ approach (Option 1 above) and let the scheduler
  publish after commit.
- If you want transports to participate in transactions (defer sends until after
  commit), consider adding an explicit transport capability like
  `ITransactionalPublisher` and a commit/after-commit hook integration.
- Optionally move the test-domain entity used in integration tests into a real
  entity file under `libs/storage-mikro-orm/src/entities/` if you prefer reuse.

---

File references:

- `libs/cap-nest/src/cap/abstractions/storage.interface.ts` — new interface
  location
- `libs/cap-nest/src/cap/cap.service.ts` — publishes using transactional save
  when available
- `libs/storage-mikro-orm/src/storage/mikro-publish-storage.ts` — example
  adapter implementation
- `libs/storage-mikro-orm/test/storage.integration-spec.ts` — integration tests
  demonstrating commit & rollback

**Transactional Publisher (new)**

- **New interface**: `ITransactionalPublisher` (in
  `libs/cap-nest/src/cap/abstractions/transport.interface.ts`) — transports may
  implement:
  - `emitWithTx(topic: string, payload: unknown, tx: unknown): Promise<void>`

- **Semantics**: When a `tx` object is present and the transport implements
  `emitWithTx`, `CapService.publish` will call `emitWithTx(topic, payload, tx)`
  instead of the regular `emit`. This is an opt-in capability for transports
  that wish to coordinate with the application's transactional context.

- **Common transport strategies**:
  - Record-and-defers: record the intent to send in a transport-specific table
    inside the transaction (deferred send), then a background worker publishes
    after commit.
  - After-commit hook: the transport registers an after-commit callback with the
    transaction manager (ORM specific) and performs the send only once the DB
    transaction commits.
  - Immediate-but-safe: emit immediately but only when you are certain your
    transport guarantees delivery semantics compatible with an in-transaction
    send (rare / platform specific).

- **Test helper note**: The repo's `TestTransportSpy` implements `emitWithTx`
  but treats it like a normal `emit` and records the `tx` value — this is useful
  for unit tests that assert the transactional path is taken without
  implementing real deferred behavior.

**Example (conceptual transport emitWithTx)**

```ts
// a simple transport that records the tx and optionally defers
async emitWithTx(topic: string, payload: unknown, tx: unknown): Promise<void> {
  // record the tx or save the send-intent in the DB if needed
  if (tx) {
    // either persist a send-intent inside this transaction or register an after-commit callback
  }

  // for tests we may deliver immediately
}
```

**After-commit hook idea**

- If you want clean separation and automatic defer-until-commit, consider
  implementing a small after-commit hook API in your adapter/ORM integration.
  Pattern:
  1. During the transaction, adapters call `savePublishWithTx(...)` to persist
     the outbox.

2. The transport registers an after-commit callback with the ORM (or transaction
   wrapper).
3. After commit, the callback is invoked and the transport emits the message.

Implementing such a helper is ORM-specific (MikroORM, TypeORM, Sequelize, etc.)
and is a recommended follow-up if you need automatic, transport-agnostic
deferred sends.

**MikroORM — practical after-commit patterns**

Below are two practical approaches you can use with MikroORM to ensure messages
are sent only after the DB transaction successfully commits.

1. Simple pattern: collect post-commit sends

This approach keeps transaction code simple: collect send-intents while inside
the transaction, then perform sends after the transaction completes.

```ts
// inside your service
const pendingSends: Array<
    { topic: string; payload: unknown; headers?: Record<string, unknown> }
> = [];

await orm.em.transactional(async (em) => {
    // domain changes
    await em.persistAndFlush(myEntity);

    // persist outbox inside this transaction
    await (publishStorage as ITransactionalPublishStorage).savePublishWithTx(
        evt,
        em,
    );

    // collect a send-intent to perform after commit
    pendingSends.push({ topic: "user.created", payload: { id: myEntity.id } });
});

// After the transactional callback completes successfully, the transaction is committed.
for (const s of pendingSends) {
    // publisher.emit can be synchronous here; consider retry/error handling
    await publisher.emit(s.topic, s.payload);
}
```

2. Helper wrapper: `withTransactionAndPostCommit`

Encapsulate the pattern into a small helper that accepts a transactional
function and an `afterCommit` publisher callback.

```ts
async function withTransactionAndPostCommit<T>(
    orm: MikroORM,
    transactionalFn: (
        em: EntityManager,
        queueForPostCommit: (item: any) => void,
    ) => Promise<T>,
    afterCommitFn: (items: any[]) => Promise<void>,
): Promise<T> {
    const postCommitQueue: any[] = [];

    const result = await orm.em.transactional(async (em) => {
        // `queueForPostCommit` allows transactional code to register items to send later
        const queueForPostCommit = (item: any) => postCommitQueue.push(item);
        return transactionalFn(em, queueForPostCommit);
    });

    // transaction committed; now do the after-commit work
    if (postCommitQueue.length > 0) {
        await afterCommitFn(postCommitQueue);
    }

    return result;
}

// usage
await withTransactionAndPostCommit(
    orm,
    async (em, queue) => {
        await em.persistAndFlush(myEntity);
        await (publishStorage as ITransactionalPublishStorage)
            .savePublishWithTx(evt, em);
        queue({ topic: "user.created", payload: { id: myEntity.id } });
    },
    async (items) => {
        for (const it of items) await publisher.emit(it.topic, it.payload);
    },
);
```

Notes:

- The helper keeps all post-commit logic out of the transaction body so you
  cannot accidentally emit before commit.
- You can adapt `afterCommitFn` to perform batched sends or to hand items to a
  background worker.

Advanced: ORM hooks

- Some ORMs or transaction managers provide native hooks or events for "after
  commit"; if available prefer those for tighter integration. MikroORM doesn't
  provide a global after-commit event API across versions, so the wrapper
  approach above is portable and reliable.
