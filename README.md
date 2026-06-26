# CAP Node.js

CAP Node.js is a framework-agnostic reliable messaging package set for Node.js.
It adds durable outbox/inbox persistence, retry scheduling, pluggable storage
and transport adapters, and optional dashboard bindings for NestJS and Express.

CAP does not replace your application framework or broker client. The core
engine owns reliability semantics; framework adapters provide lifecycle and
integration points for NestJS and Express.

```txt
Application code
  -> CAP reliable publish / subscribe
      -> outbox + inbox storage
      -> transport adapter
          -> Azure Service Bus, NestJS ClientProxy, or custom transport
```

## Status

This repository contains the stable `v2.1.1` package set. The core messaging
path, first-party adapters, dashboard auth extension points, header
propagation, and release workflow are implemented for the supported boundaries
documented below.

The root workspace package is private. The publishable packages live under
`libs/*`.

## Packages

| Package                                        | Purpose                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@mikara89/cap-nest`                           | Core NestJS module, service, decorators, scheduler, abstractions, and in-memory mode.                     |
| `@mikara89/cap-testing`                        | Framework-agnostic testing helpers, fakes, fixtures, and in-memory engine setup.                          |
| `@mikara89/cap-express`                        | Express adapter with explicit lifecycle and CAP health router.                                            |
| `@mikara89/cap-storage-mikro-orm`              | MikroORM storage adapter for outbox and inbox records.                                                    |
| `@mikara89/cap-storage-knex`                   | Knex storage adapter for outbox and inbox records.                                                        |
| `@mikara89/cap-storage-typeorm`                | TypeORM storage adapter for outbox and inbox records.                                                     |
| `@mikara89/cap-transport-azure-servicebus`     | Azure Service Bus transport adapter.                                                                      |
| `@mikara89/cap-transport-nestjs-microservices` | Adapter that publishes through existing NestJS `ClientProxy` registrations and exposes an inbound bridge. |
| `@mikara89/cap-dashboard-core`                 | Framework-agnostic dashboard DTOs and service logic.                                                      |
| `@mikara89/cap-dashboard-nest`                 | NestJS dashboard module, REST API, and static dashboard UI.                                               |
| `@mikara89/cap-dashboard-express`              | Express router for the dashboard service.                                                                 |
| `@mikara89/cap-dashboard`                      | Compatibility alias for the Nest dashboard package.                                                       |

`apps/cap-test-app` is a demo and integration test application; it is not a
published package.

Current first-party durable storage adapters are MikroORM, Knex, and TypeORM.
Prisma remains a planned follow-up for v2.3.

Current first-party transports are Azure Service Bus and the NestJS
microservices bridge. RabbitMQ, Kafka, and AWS SNS/SQS transports are planned
for v2.4 after transport conformance tests and capability metadata are added.

v2.2 adds the transaction context foundation, transaction manager extension
points, publish storage contract tests, and informational storage capability
types. v2.3 extends storage contract coverage and adds Knex and TypeORM
storage adapters. Planned Prisma and v2.4 transport packages are roadmap items,
not installable packages today.

## Requirements

- Node.js 22, matching CI.
- npm, using the committed `package-lock.json`.
- NestJS 11 for the current packages.
- TypeScript 5.7 or newer for local development.

Adapter-specific requirements:

- `@mikara89/cap-storage-mikro-orm` requires MikroORM 6.
- `@mikara89/cap-storage-knex` requires Knex 3 and a Knex dialect driver.
- `@mikara89/cap-storage-typeorm` requires TypeORM 0.3 and a TypeORM dialect driver.
- `@mikara89/cap-transport-azure-servicebus` requires Azure Service Bus credentials or
  an emulator path for external integration testing.

## Installation

Packages are published to GitHub Packages. Configure npm for the package scope
before installing:

```sh
npm config set @mikara89:registry https://npm.pkg.github.com
```

Install the core package:

```sh
npm install @mikara89/cap-nest
```

For durable MikroORM storage and Azure Service Bus transport:

```sh
npm install @mikara89/cap-nest @mikara89/cap-storage-mikro-orm @mikara89/cap-transport-azure-servicebus
```

For durable Knex storage, install Knex and a dialect driver such as `pg`,
`mysql2`, `mariadb`, or `better-sqlite3`:

```sh
npm install @mikara89/cap-storage-knex knex pg
```

For durable TypeORM storage, install TypeORM and a dialect driver such as `pg`,
`mysql2`, `mariadb`, or `better-sqlite3`:

```sh
npm install @mikara89/cap-storage-typeorm typeorm pg
```

For the optional Nest dashboard:

```sh
npm install @mikara89/cap-dashboard-nest
```

`@mikara89/cap-dashboard` remains available as a compatibility alias.

Package availability depends on GitHub Packages visibility. GitHub Packages may
require npm authentication with a GitHub personal access token for installs.
See [Release checklist](docs/release.md).

## Basic Usage

The smallest local setup uses the in-memory bundle:

```ts
import { Module } from '@nestjs/common';
import { CapModule } from '@mikara89/cap-nest';

@Module({
  imports: [CapModule.forInMemory()],
})
export class AppModule {}
```

Publish from an injectable:

```ts
import { Injectable } from '@nestjs/common';
import { CapService } from '@mikara89/cap-nest';

@Injectable()
export class UsersService {
  constructor(private readonly cap: CapService) {}

  async createUser(): Promise<void> {
    await this.cap.publish('user.created', {
      id: 'u1',
      email: 'alice@example.com',
    });
  }
}
```

Publish inside an application transaction by passing the existing transaction
handle or a CAP operation context:

```ts
await cap.publish('user.created', payload, { tx: em });

await cap.publish('user.created', payload, { ctx: { tx: em } });
```

When `tx` or `ctx.tx` is provided, CAP saves the outbox row inside that
transaction and defers broker emit by default. The scheduler dispatches after
commit. Use `immediate: true` only when intentionally attempting broker emit in
the same call.

Subscribe with a handler:

```ts
import { Injectable } from '@nestjs/common';
import { CapSubscribe } from '@mikara89/cap-nest';

@Injectable()
export class MailHandler {
  @CapSubscribe({ topic: 'user.created', group: 'mail-service' })
  async handleUserCreated(payload: { id: string; email: string }) {
    // Send a welcome email.
  }
}
```

## Production-Style Setup

Production applications should use durable storage and an external transport.
The current first-party production-oriented path combines MikroORM storage with
Azure Service Bus transport:

> Warning: multi-instance durable outbox dispatch requires a lock-capable
> MikroORM SQL driver such as PostgreSQL or MySQL, or a custom storage adapter
> with equivalent claim safety. SQLite and other local/non-locking drivers are
> supported only for demos, development, and single-process tests. SQL Server
> requires a future SQL Server-specific claim implementation before it is
> supported for multi-instance dispatch by the first-party MikroORM adapter.

```ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CapModule } from '@mikara89/cap-nest';
import {
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/cap-storage-mikro-orm';
import { MikroStorageModule } from '@mikara89/cap-storage-mikro-orm/nest';
import { ServiceBusTransportModule } from '@mikara89/cap-transport-azure-servicebus/nest';

const serviceBusTransport = ServiceBusTransportModule.forRoot({
  connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
  topicPrefix: 'cap-',
  subscriptionPrefix: 'sub-',
});

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: process.env.DB_NAME,
      entities: [CapPublishEntity, CapReceivedEntity],
    }),
    MikroStorageModule,
    serviceBusTransport,
    CapModule.forRoot({
      imports: [MikroStorageModule, serviceBusTransport],
      init: {
        createSchema: false,
        createQueues: false,
      },
    }),
  ],
})
export class AppModule {}
```

Use environment variables or a secret manager for connection strings and
database credentials. Do not commit real credentials.

`CapModule` is global by design for v1. Register it once in the application
root; feature modules can inject `CapService` without re-importing CAP.

## Dashboard

The dashboard is optional and must be protected by an application-owned guard:

```ts
import { CapDashboardModule } from '@mikara89/cap-dashboard-nest';

CapDashboardModule.forRoot({
  guard: {
    provide: 'CAP_DASHBOARD_GUARD',
    useValue: { canActivate: () => true },
  },
  routePrefix: '/api/cap',
  uiRoute: '/cap-dashboard',
});
```

The sample guard is for local demos only. Replace it with real authentication
and authorization before exposing dashboard routes.

## API Overview

Primary exports from `@mikara89/cap-nest`:

- `CapModule` for registering CAP with in-memory or adapter-backed providers.
- `CapService` for publishing messages.
- `@CapSubscribe` for registering subscribers.
- `@CapHeaders` and `CapHeaders` for accessing transport metadata.
- Storage and transport interfaces/tokens for adapter authors.

See the package READMEs and [documentation index](docs/README.md) for adapter
details.

Additional references:

- [API reference](docs/api/README.md)
- [Compile-checked examples](examples/README.md)
- [Package export surface](docs/package-exports.md)

## Local Development

Install dependencies:

```sh
npm install
```

Run tests:

```sh
npm test
```

Run lint checks without modifying files:

```sh
npm run lint:check
```

Build libraries and the demo app:

```sh
npm run build
```

Verify publish package contents:

```sh
npm run pack:dry-run
```

Check examples and generate API docs:

```sh
npm run examples:check
npm run docs:api
```

## Troubleshooting

- If dashboard routes are accessible without authentication, replace the sample
  guard with a real NestJS guard before deploying.
- If external Service Bus integration tests fail, confirm
  `SERVICEBUS_CONNECTION_STRING` or an emulator path is available.
- If package dry-runs fail because npm cannot write to its cache, clear or move
  the npm cache and rerun the command.
- Keep automatic schema and broker provisioning disabled in production unless
  you explicitly want CAP to create those resources.
- Durable MikroORM inbox deduplication uses `(group, dedupeKey)`, and outbox
  claiming relies on pessimistic partial write locking. Multi-instance durable
  outbox dispatch is production-supported for lock-capable drivers covered by
  the DB integration gate, currently PostgreSQL and MySQL. SQLite/local demo
  drivers use a non-locking fallback and should not be used for multi-instance
  dispatch. SQL Server is not multi-instance supported by the first-party
  MikroORM adapter until it has a SQL Server-specific claim implementation.
  Existing prerelease databases need a migration for new inbox status/dead-letter
  fields and the dedupe index change.

## Documentation

- [Documentation index](docs/README.md)
- [Getting started](docs/getting-started.md)
- [Transactions](docs/transactions.md)
- [Architecture](docs/architecture.md)
- [Adapters](docs/adapters.md)
- [Dashboard](docs/cap-dashboard.md)
- [API reference](docs/api/README.md)
- [Package export surface](docs/package-exports.md)
- [Roadmap](docs/roadmap.md)
- [Release checklist](docs/release.md)
- [ADRs](docs/adr/README.md)
- [Contributing](CONTRIBUTING.md)

## Contributing

Contributions are welcome while the API is maturing. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, pull request guidelines,
and documentation expectations.

## License

MIT. See [LICENSE](LICENSE).
