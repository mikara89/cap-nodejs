# @mikara89/cap-nest

Core NestJS package for CAP reliable messaging.

This package provides:

- `CapModule`
- `CapService`
- `@CapSubscribe`
- storage and transport DI tokens
- outbox/inbox models
- retry scheduler wiring
- in-memory mode for tests and local examples

## Minimal Usage

```ts
import { Module } from '@nestjs/common';
import { CapModule } from '@mikara89/cap-nest';

@Module({
  imports: [CapModule.forInMemory()],
})
export class AppModule {}
```

```ts
await capService.publish('user.created', { id: 'u1' });
```

```ts
@CapSubscribe({ topic: 'user.created', group: 'mail-service' })
async handleUserCreated(payload: unknown) {
  // handle message
}
```

## Documentation

- [Repository overview](../../README.md)
- [Getting started](../../docs/getting-started.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Architecture](../../docs/architecture.md)
- [Adapters](../../docs/adapters.md)
- [ADRs](../../docs/adr/README.md)
