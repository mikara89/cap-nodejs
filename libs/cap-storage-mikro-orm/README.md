# @mikara89/cap-storage-mikro-orm

MikroORM storage adapter for CAP.

This package provides durable outbox and inbox persistence through:

- `CapPublishEntity`
- `CapReceivedEntity`
- `MikroPublishStorage`
- `MikroReceivedStorage`
- `MikroStorageModule`

## Usage Shape

```ts
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/cap-storage-mikro-orm';

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

- Manage production schemas through migrations or infrastructure tooling.
- Production outbox dispatch requires a MikroORM SQL driver that supports
  pessimistic partial write locking; use a custom storage adapter if your
  database cannot provide equivalent claim safety.
- The first-party multi-instance DB gate covers PostgreSQL and MySQL.
- SQLite/local demo drivers and SQL Server fall back to non-locking
  transactional claims and are not supported for multi-instance durable
  dispatch by this adapter.
- `savePublishWithTx` is available for transactional outbox persistence.
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
