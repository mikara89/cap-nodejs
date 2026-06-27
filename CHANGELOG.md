# Changelog

All notable repository-level changes should be summarized here.

Package-specific changelogs are maintained with each publishable package:

- [@mikara89/cap-core](libs/cap-core/CHANGELOG.md)
- [@mikara89/cap-nest](libs/cap-nest/CHANGELOG.md)
- [@mikara89/cap-testing](libs/cap-testing/CHANGELOG.md)
- [@mikara89/cap-express](libs/cap-express/CHANGELOG.md)
- [@mikara89/cap-storage-mikro-orm](libs/cap-storage-mikro-orm/CHANGELOG.md)
- [@mikara89/cap-storage-knex](libs/cap-storage-knex/CHANGELOG.md)
- [@mikara89/cap-storage-typeorm](libs/cap-storage-typeorm/CHANGELOG.md)
- [@mikara89/cap-storage-prisma](libs/cap-storage-prisma/CHANGELOG.md)
- [@mikara89/cap-transport-azure-servicebus](libs/cap-transport-azure-servicebus/CHANGELOG.md)
- [@mikara89/cap-transport-nestjs-microservices](libs/cap-transport-nestjs-microservices/CHANGELOG.md)
- [@mikara89/cap-dashboard-nest](libs/cap-dashboard-nest/CHANGELOG.md)
- [@mikara89/cap-dashboard](libs/cap-dashboard/CHANGELOG.md)

## Unreleased

- Migrated the only active package publishing target from GitHub Packages to
  public npmjs packages, with guarded bootstrap and trusted-publishing support.
- Added public repository documentation and GitHub community templates for open
  source readiness.
- Added generated API documentation tooling, compile-checked examples, and a
  package export-surface audit.

## 2.3.0 (2026-06-27)

- Expanded first-party storage reach with framework-free Knex, TypeORM, and
  model-free raw-SQL Prisma adapters alongside MikroORM.
- Added reusable received-storage contracts to `@mikara89/cap-testing`,
  complementing the publish-storage contracts introduced in v2.2.
- Added PostgreSQL, MySQL/MariaDB, and SQLite support across the new SQL-backed
  adapters. PostgreSQL and MySQL are the multi-instance integration targets;
  SQLite remains a local-development and single-process option.
- Added compile-checked schema initialization, engine wiring, explicit
  transaction, and operation-context examples for Knex, TypeORM, and Prisma.
- Kept a shared SQL core deferred until duplication across real adapters proves
  that extraction is worthwhile.
- Kept RabbitMQ, Kafka, and AWS SNS/SQS as planned v2.4 transports; Google
  Pub/Sub and NATS remain v2.5+ candidates.

## 2.2.0 (2026-06-26)

- Added the transaction context foundation with `CapOperationContext`, `ctx`
  publish support, optional ambient context, and the `CapTransactionManagerPort`
  extension point.
- Added MikroORM operation-context support, reusable publish-storage contract
  tests, and informational storage capability metadata.
- Kept existing `tx` publish calls working, with `ctx` taking precedence when
  both options are provided, and retained `savePublishWithTx` only as deprecated
  compatibility.
- No breaking changes are expected for existing transaction-handle users.

## 0.7.0-beta.0

- First beta package line for the CAP for NestJS MVP package set.
- Includes the core CAP module, MikroORM storage, Azure Service Bus transport,
  NestJS microservices transport, and optional dashboard package.
