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
- `@mikara89/cap-transport-azure-servicebus` as the current first-party broker
  transport adapter.
- `@mikara89/cap-transport-nestjs-microservices` as the current bridge adapter
  for existing NestJS `ClientProxy` registrations.
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

CAP starts v2.3 with storage contract hardening and adds first-party Knex and
TypeORM storage. Prisma follows after the shared foundation is in place.
SQL-core extraction remains deferred until duplication is proven.

Planned scope:

- Harden the storage adapter contract suite first, including received-storage
  conformance.
- First adapters after the foundation PR: `@mikara89/cap-storage-knex` and
  `@mikara89/cap-storage-typeorm`.
- Follow-up planned adapter: `@mikara89/cap-storage-prisma`.
- Add a storage adapter matrix and examples.
- Do not add a generic SQL core yet.
- Keep SQL core as future work only after duplication is proven across real
  adapters.

Potential future storage candidates beyond v2.3 include Drizzle, Sequelize,
Mongoose, and raw `pg` or custom SQL adapters.

## v2.4 Transport Reach

CAP adds first-party RabbitMQ, Kafka, and AWS SNS/SQS transports after transport
capability and conformance tests are introduced.

Planned scope:

- Add a transport contract suite and transport capability model first.
- Planned first-party package: `@mikara89/cap-transport-rabbitmq`.
- Planned first-party package: `@mikara89/cap-transport-kafka`.
- Planned first-party package: `@mikara89/cap-transport-aws-sns-sqs`.
- Add a transport adapter matrix and examples.

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
- Do not add RabbitMQ, Kafka, AWS SNS/SQS, Google Pub/Sub, NATS JetStream, Redis
  Streams, MQTT, or other broker implementations as part of v2.2.
- Do not build a generic SQL core before at least two or three storage adapters
  prove real duplication.
- Add conformance tests and capability models before broadening each adapter
  family.
- Keep current packages and planned packages clearly separated in README and
  docs.
- Do not promise exact release dates from this roadmap.
