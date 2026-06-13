# CAP for NestJS

CAP is a NestJS library for reliable application messaging. It provides an
outbox/inbox pattern, pluggable storage and transport adapters, retry scheduling,
and an optional dashboard for inspecting and operating message state.

This repository is a monorepo that contains the core library, first-party
adapters, a dashboard package, and a test application.

## Current Status

The project is pre-MVP. The core messaging path is implemented and covered by
tests, but a few MVP items remain before the packages should be treated as
production-ready:

- decide whether the `CapHeaders` decorator feature belongs in MVP or post-MVP
- harden external Azure Service Bus integration coverage
- finish release/version policy for the first public MVP package set

## Packages

- `@cap/cap-nest` - core NestJS module, abstractions, service, decorators,
  scanner, scheduler, and in-memory mode.
- `@cap/mikroorm-storage` - MikroORM storage adapter for outbox and inbox
  records.
- `@cap/azure-servicebus-transport` - Azure Service Bus transport adapter.
- `@cap/cap-dashboard` - optional admin REST API and static dashboard UI.
- `apps/cap-test-app` - demo and integration test application.

## Quick Start

Install dependencies:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

Build libraries and app:

```powershell
npm run build
```

Start the demo app:

```powershell
npm run start
```

For the smallest local setup, use the in-memory bundle:

```ts
import { Module } from '@nestjs/common';
import { CapModule } from '@cap/cap-nest';

@Module({
  imports: [CapModule.forInMemory()],
})
export class AppModule {}
```

## Documentation

- [Documentation index](docs/README.md)
- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Adapters](docs/adapters.md)
- [Dashboard](docs/cap-dashboard.md)
- [Roadmap](docs/roadmap.md)
- [Release checklist](docs/release.md)
- [ADRs](docs/adr/README.md)
- [Contributing](docs/contributing.md)

## Architecture Decisions

Durable architecture decisions are tracked as Architecture Decision Records in
[`docs/adr`](docs/adr/README.md). Start there when changing core reliability,
adapter boundaries, dashboard packaging, or transactional behavior.
