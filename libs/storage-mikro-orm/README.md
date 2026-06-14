# @mikara89/mikroorm-storage

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
import { CapModule, CapAdapterModule } from '@mikara89/cap-nest';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/mikroorm-storage';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: process.env.DB_NAME,
      entities: [CapPublishEntity, CapReceivedEntity],
    }),
    MikroStorageModule,
    CapModule.forAdapters(
      MikroStorageModule,
      transportModule as unknown as CapAdapterModule,
    ),
  ],
})
export class AppModule {}
```

## Notes

- Manage production schemas through migrations or infrastructure tooling.
- `savePublishWithTx` is available for transactional outbox persistence.
- Dashboard list/find helpers are an MVP gap.

## Documentation

- [Repository overview](../../README.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Adapters](../../docs/adapters.md)
- [Architecture](../../docs/architecture.md)
- [Roadmap](../../docs/roadmap.md)
- [ADRs](../../docs/adr/README.md)
