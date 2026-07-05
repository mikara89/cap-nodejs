# Roadmap

This roadmap distinguishes the package set available today from planned adapter
reach. ADRs capture durable decisions; this document captures sequencing and
ecosystem direction.

## Current Stable Package Set

The current first-party package set is framework-agnostic at the core and
provides framework adapters where they are useful:

- `@mikara89/cap-core` for the engine, ports, operation context, transaction
  extension points, and in-memory primitives.
- `@mikara89/cap-nest` for NestJS module registration, decorators, scanner,
  scheduler integration, and `CapService`.
- `@mikara89/cap-express` for Express lifecycle and health router integration.
- `@mikara89/cap-testing` for fakes, fixtures, and in-memory engine setup.
- `@mikara89/cap-storage-mikro-orm` as the current first-party durable storage
  adapter.
- `@mikara89/cap-storage-knex` as a current framework-free SQL storage adapter.
- `@mikara89/cap-storage-typeorm` as a current framework-free TypeORM storage
  adapter.
- `@mikara89/cap-storage-prisma` as a current framework-free Prisma storage
  adapter using raw SQL and interactive transaction clients.
- `@mikara89/cap-transport-azure-servicebus` as the current first-party broker
  transport adapter.
- `@mikara89/cap-transport-nestjs-microservices` as the current bridge adapter
  for existing NestJS `ClientProxy` registrations.
- `@mikara89/cap-transport-rabbitmq` as the current framework-neutral RabbitMQ
  adapter with confirmed publishing and manual acknowledgements.
- `@mikara89/cap-transport-kafka` as the current framework-neutral Kafka
  adapter with acknowledged publishing and success-only offset commits.
- `@mikara89/cap-dashboard-core`, `@mikara89/cap-dashboard-nest`, and
  `@mikara89/cap-dashboard-express` for dashboard service logic and framework
  bindings.
- `@mikara89/cap-dashboard` as a compatibility alias for the Nest dashboard
  package.

## v2.2 Transaction Context Foundation

CAP core standardizes operation context and transaction-manager extension points
so storage adapters can bind ORM-specific transaction objects without CAP core
depending on any ORM.

Scope:

- Operation context foundation for ORM-agnostic transactional outbox behavior.
- `CapOperationContext<TTx>`.
- `CapPublishOptions` support for both `tx` and `ctx`.
- `PublishStoragePort.savePublish(event, ctx?)` as the primary
  transaction-aware storage API.
- `savePublishWithTx(event, tx)` retained only as deprecated compatibility.
- Optional `CapTransactionManagerPort`.
- Optional AsyncLocalStorage-based transaction context.
- Publish storage contract tests in `@mikara89/cap-testing`.
- Informational storage capability model.

v2.2 is not the storage adapter expansion release. Knex, TypeORM, Prisma, and a
generic SQL core are not part of the v2.2 minimum scope.

## v2.3 Storage Contract Hardening and Storage Reach

CAP v2.3 hardens the storage contracts and adds first-party Knex, TypeORM, and
Prisma storage. SQL-core extraction remains deferred until duplication is
proven.

Delivered scope:

- Hardened the storage adapter contract suite with received-storage
  conformance.
- Added `@mikara89/cap-storage-knex` as a SQL query-builder adapter using
  `Knex.Transaction` contexts.
- Added `@mikara89/cap-storage-typeorm` as an ORM adapter using TypeORM
  `EntityManager` contexts.
- Added `@mikara89/cap-storage-prisma` as a raw-SQL Prisma Client adapter using
  `Prisma.TransactionClient` contexts. It does not require CAP models in the
  application Prisma schema.
- Added the storage adapter matrix and compile-checked examples.
- Deferred a generic SQL core until duplication is proven across real
  adapters.

MikroORM remains the current ORM-specific adapter using its `EntityManager` as
the transaction context. Potential future storage candidates beyond v2.3
include Drizzle, Sequelize, and Mongoose. Raw SQL adapters or a shared SQL core
remain future work only if the current implementations prove enough repeated
logic.

## v2.4 Transport Reach

The v2.4 repository roadmap milestone expands transport reach in five ordered
PR phases. All five phases are delivered.

1. **PR 1 - transport contract foundation:** verify the existing core ports,
   add the adapter-neutral `defineTransportContract` suite, qualify Azure
   Service Bus and the NestJS Microservices bridge with fakes, and document the
   lifecycle and settlement boundary.
2. **PR 2 - RabbitMQ transport (delivered):** implement and qualify
   `@mikara89/cap-transport-rabbitmq` with publisher confirms, manual consumer
   settlement, conservative topology options, and pinned-broker integration.
3. **PR 3 - Kafka transport (delivered):** implement and qualify
   `@mikara89/cap-transport-kafka` with acknowledged publishing, native
   consumer groups, and success-only manual offset commits.
4. **PR 4 - AWS SNS/SQS transport (delivered):** implement and qualify the
   `@mikara89/cap-transport-aws-sns-sqs` package with SNS publishing, SQS
   long-polling, and success-only message deletion.
5. **PR 5 - docs, examples, compatibility and release review:** complete the
   adapter matrix and examples, verify compatibility, and perform release
   readiness review.

An explicit `cap-core` transport capability interface is deferred until
conformance tests demonstrate real portable variation that applications need
to inspect. PR 1 does not claim broker acknowledgement, delayed delivery,
ordering, topology, dead-letter, or request/reply guarantees.

Google Pub/Sub and NATS JetStream are likely v2.5 candidates, not v2.4 minimum
scope. Redis Streams, MQTT, and other niche transports remain later or optional
ecosystem work.

## v2.5+ Ecosystem Expansion

Likely candidates:

- Google Pub/Sub transport.
- NATS JetStream transport.
- Transport capability warnings in framework adapters and dashboards.
- Dashboard visibility into storage and transport capabilities.
- Possible SQL-core extraction after at least two or three real storage
  adapters prove repeated implementation details.
- Additional observability with metrics and tracing.
- Richer message metadata, correlation, and payload schema/versioning guidance.

## Non-Goals and Sequencing Rules

- Do not treat planned packages as available until they are implemented,
  documented, tested, and exported.
- Do not add Knex, TypeORM, Prisma, or generic SQL core implementation as part
  of v2.2.
- Do not backport RabbitMQ, Kafka, AWS SNS/SQS, Google Pub/Sub, NATS JetStream,
  Redis Streams, MQTT, or other broker implementations into v2.2.
- Do not build a generic SQL core before at least two or three storage adapters
  prove real duplication.
- Add conformance tests before broadening each adapter family; add capability
  models only when tests prove a portable need.
- Keep current packages and planned packages clearly separated in README and
  docs.
- Do not promise exact release dates from this roadmap.
