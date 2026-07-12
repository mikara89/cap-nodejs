# @mikara89/cap-storage-mikro-orm

MikroORM storage adapter for CAP.

This package provides durable outbox and inbox persistence through:

- `CapPublishEntity`
- `CapReceivedEntity`
- `MikroPublishStorage`
- `MikroReceivedStorage`
- `MikroStorageModule` from the explicit Nest subpath

## Usage Shape

```ts
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/cap-storage-mikro-orm';
import { MikroStorageModule } from '@mikara89/cap-storage-mikro-orm/nest';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: process.env.DB_NAME,
      entities: [CapPublishEntity, CapReceivedEntity],
    }),
    MikroStorageModule,
    transportModule,
  ],
})
export class AppModule {}
```

## Notes

- The package root is framework-neutral. Use `/nest` exports only when wiring
  the optional Nest module, and install the Nest peers for that usage.
- Manage production schemas through migrations or infrastructure tooling.
- Production outbox dispatch requires a MikroORM SQL driver that supports
  pessimistic partial write locking; use a custom storage adapter if your
  database cannot provide equivalent claim safety.
- The first-party multi-instance DB gate covers PostgreSQL and MySQL.
- Outbox completion, failure, and active lease renewal use atomic ownership
  predicates. `lockedBy` is an opaque per-claim token, and stale owners receive
  `false` rather than mutating reclaimed rows.
- SQLite/local demo drivers and SQL Server fall back to non-locking
  transactional claims and are not supported for multi-instance durable
  dispatch by this adapter.
- `MikroPublishStorage` and `MikroReceivedStorage` implement
  `CapabilityAwareStoragePort`. PostgreSQL and MySQL report safe skip-locked
  claiming; SQLite, SQL Server, and unknown/local drivers report conservative
  non-locking claiming capability.
- MikroORM transaction-aware publish can use the operation context API:

  ```ts
  await cap.publish('user.created', payload, {
    ctx: { tx: em },
  });
  ```

  The old top-level `tx` style still works:

  ```ts
  await cap.publish('user.created', payload, {
    tx: em,
  });
  ```

  When `tx` or `ctx.tx` is provided, CAP saves the outbox row inside that
  transaction and defers broker emit by default. The scheduler dispatches after
  commit.

- `savePublishWithTx` remains as deprecated compatibility. Prefer
  `savePublish(event, { tx })` in storage integrations.
- Inbox idempotency uses unique `(group, dedupeKey)` records. Existing
  databases upgrading from message-id dedupe need a migration that adds inbox
  `status`, `lastError`, and `processedAt` columns and replaces the old unique
  index.
- Dashboard list/find helpers are included for outbox and inbox records.

## Documentation

- [Repository overview](../../README.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Adapters](../../docs/adapters.md)
- [Architecture](../../docs/architecture.md)
- [Roadmap](../../docs/roadmap.md)
- [ADRs](../../docs/adr/README.md)
