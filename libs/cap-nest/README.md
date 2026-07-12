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

`forRoot`, `forRootAsync`, and `forInMemory` accept the core envelope migration
option:

```ts
CapModule.forRoot({
  imports: [storageModule, transportModule],
  messageEnvelope: { legacyUnversioned: 'reject' },
});
```

The default `warn` mode accepts strict legacy `{ payload, headers? }` bodies and
warns once per engine. New bridges that need one body should use
`createCapMessageEnvelope()` re-exported by `@mikara89/cap-nest`. Ordinary
business payloads containing a `payload` field are not broadly unwrapped.

```ts
await capService.publish('user.created', { id: 'u1' });
```

```ts
@CapSubscribe({ topic: 'user.created', group: 'mail-service' })
async handleUserCreated(payload: unknown) {
  // handle message
}
```

## Subscription Lifecycle

Nest discovers `@CapSubscribe` handlers during `onModuleInit` and registers
them without broker I/O. After all modules initialize, CAP's
`onApplicationBootstrap` hook awaits adapter initialization and
`SubscriberPort.consume()` attachment for every registered handler. An initial
attachment failure therefore rejects application bootstrap instead of allowing
the application to become ready without its consumers.

Use Nest's normal awaited bootstrap before accepting traffic:

```ts
const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

Enable Nest shutdown hooks and await `app.close()` (or the framework shutdown
path) for graceful consumer cleanup. CAP deduplicates shutdown and closes the
subscriber during `onApplicationShutdown`.

## Documentation

- [Repository overview](../../README.md)
- [Getting started](../../docs/getting-started.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Architecture](../../docs/architecture.md)
- [Adapters](../../docs/adapters.md)
- [ADRs](../../docs/adr/README.md)
