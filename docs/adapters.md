# Adapters

CAP keeps storage and transport behind `cap-core` ports. Framework adapters wire
those ports into NestJS, Express, or another runtime so applications can choose
the database and broker that fit their environment.

## Registration

Storage and transport adapters provide the CAP ports they implement:

- `PUBLISH_STORAGE` with a `PublishStoragePort`
- `RECEIVED_STORAGE` with a `ReceivedStoragePort`
- `PUBLISHER` with a `PublisherPort`
- `SUBSCRIBER` with a `SubscriberPort`

NestJS adapters normally expose modules that bind those ports through
dependency-injection tokens. Register those modules with CAP through real module
imports:

```ts
CapModule.forRoot({
  imports: [MikroStorageModule, serviceBusTransport],
  init: {
    createSchema: false,
    createQueues: false,
  },
});
```

## Storage Responsibilities

`PublishStoragePort` stores outbox records and must support durable claim/lease
dispatch:

- `savePublish(event, ctx?)`
- `claimUnpublished({ limit, lockedBy, lockUntil, now })`
- `markPublished(id, publishedAt?)`
- `markPublishFailed(id, error, { maxRetries, nextRetryAt, now })`
- `releaseExpiredClaims(now)`
- optional `initialize(options)`
- optional dashboard helpers: `findPublishById`, `listPublish`
- deprecated compatibility only: `savePublishWithTx(event, tx)`

`savePublish(event, ctx?)` is the primary transaction-aware API. Storage
adapters should read `ctx.tx` when they support ORM-specific transactions.
`savePublishWithTx(event, tx)` remains only for deprecated compatibility with
older adapters and examples.

`MarkPublishFailedOptions` includes `now` so storage adapters can persist
failure timestamps consistently with scheduler decisions.

Storage adapters can also implement `CapabilityAwareStoragePort` to expose
informational capabilities such as transaction support and safe skip-locked
claiming. CAP does not fail startup based on capability values in v2.2; use
them for diagnostics, tests, documentation, and future dashboard visibility.

### Publish Storage Conformance

v2.2 adds reusable publish-storage contract tests in
`@mikara89/cap-testing`. Storage adapters should run
`definePublishStorageContract()` in their test suite and pass capability flags
for transactions, rollback, and safe concurrent claiming. Unsupported
capabilities should be skipped explicitly by the contract, not hidden in custom
test setup.

Every v2.3 storage adapter, including Prisma, must pass the relevant
publish-storage contract suite before it is treated as first-party. The
contract uses `savePublish(event, ctx?)` as the primary API.
`savePublishWithTx(event, tx)` remains deprecated compatibility only.

### Received Storage Conformance

v2.3 starts by hardening storage contracts with a reusable received-storage
contract suite in `@mikara89/cap-testing`. Storage adapters should run
`defineReceivedStorageContract()` in their test suite and pass capability flags
for atomic insert-ignore and safe concurrent duplicate insert behavior.
Unsupported concurrency guarantees should be skipped explicitly by the
contract.

`ReceivedStoragePort` stores inbox records with dedupe-key idempotency and
dead-letter-aware retry state:

- `trySaveReceived(event)` returning `{ inserted, id, event }`
- `markProcessed(id)`
- `markReceivedFailed(id, error, { maxRetries, nextRetryAt, now })`
- `getRetryDue(limit)`
- optional `initialize(options)`
- optional dashboard helpers: `findReceivedById`, `listReceived`

Inbox dedupe remains scoped to consumer `group` plus `dedupeKey`. Broker
`messageId` is traceability metadata unless the transport also uses it as the
dedupe key.

See [Storage adapter author guide](storage-adapter-author-guide.md) and
[v2.3 storage adapters checklist](migration/v2.3-storage-adapters.md) for the
first-party adapter readiness rules.

## Transport Responsibilities

`PublisherPort` emits messages to a broker:

- `emit(topic, payload, headers?, { messageId })`
- optional `initialize(options)`

`SubscriberPort` attaches group-aware consumers:

- `consume(topic, group, onMessage(payload, headers?, metadata?))`
- optional `initialize(options)`
- optional `close()`

### Transport Conformance

v2.4 PR 1 adds `defineTransportContract()` to
`@mikara89/cap-testing`. Transport adapters should run it against fast client
fakes while retaining emulator or broker integration tests. It covers publish
mapping, headers and message identity, errors, inbound handler registration,
delivery metadata, supported repeated lifecycle calls, and resource cleanup.

Lifecycle capabilities are explicit contract options, so unsupported checks
are skipped visibly. No core transport capability model is added yet: the
current adapters have not proven a portable caller-facing requirement beyond
the existing ports.

Subscriber metadata should include a stable `messageId` when the broker exposes
one. If a transport can provide a stronger idempotency identity, it should pass
`dedupeKey`; CAP stores `messageId` for traceability but first-party durable
storage deduplicates by consumer group and `dedupeKey`.

Headers are CAP transport metadata. First-party transports preserve primitive
header values: `string`, `number`, `boolean`, and `Date`.

Important subscriber invariant:

- If CAP successfully persists the inbox record, the broker message may be
  acknowledged, completed, or committed.
- If inbox persistence fails, the broker message should not be acknowledged.
- Handler failure should be persisted in the CAP inbox and should not cause
  infinite broker redelivery loops by default.

## Storage Adapter Matrix

| Adapter            | Status                                                   | Adapter style                                                                   | Transaction context        |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| MikroORM           | Current: `@mikara89/cap-storage-mikro-orm`               | ORM-specific adapter                                                            | `MikroORM EntityManager`   |
| Knex               | Current: `@mikara89/cap-storage-knex`                    | SQL query-builder adapter                                                       | `Knex.Transaction`         |
| TypeORM            | Current: `@mikara89/cap-storage-typeorm`                 | ORM adapter                                                                     | `TypeORM EntityManager`    |
| Prisma             | Current: `@mikara89/cap-storage-prisma`                  | Raw-SQL Prisma Client adapter; CAP models are not required in the Prisma schema | `Prisma.TransactionClient` |
| Drizzle            | Future candidate                                         | Not implemented                                                                 | Not defined                |
| Sequelize          | Future candidate                                         | Not implemented                                                                 | Not defined                |
| Mongoose           | Future candidate                                         | Not implemented                                                                 | Not defined                |
| raw SQL / SQL-core | Deferred until current adapters prove enough duplication | Not implemented                                                                 | Not defined                |

## Transport Adapter Matrix

| Adapter                | Status                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| Azure Service Bus      | Current first-party adapter: `@mikara89/cap-transport-azure-servicebus`. |
| NestJS microservices   | Current bridge adapter: `@mikara89/cap-transport-nestjs-microservices`.  |
| RabbitMQ               | Current first-party adapter: `@mikara89/cap-transport-rabbitmq`.         |
| Kafka                  | Current first-party adapter: `@mikara89/cap-transport-kafka`.            |
| AWS SNS/SQS            | Planned v2.4: `@mikara89/cap-transport-aws-sns-sqs`.                     |
| Google Pub/Sub         | Likely v2.5 candidate.                                                   |
| NATS JetStream         | Likely v2.5 candidate.                                                   |
| Redis Streams and MQTT | Later optional candidates.                                               |

## First-Party Storage: MikroORM

Package: `@mikara89/cap-storage-mikro-orm`

The MikroORM adapter provides:

- `cap_publish` outbox entity/table with retry, lease, and dead-letter state
- lock-based outbox claiming; production use requires a MikroORM SQL driver
  that supports pessimistic partial write locking, or a custom storage adapter
- the first-party multi-instance DB gate covers PostgreSQL and MySQL
- SQLite/local demo drivers and SQL Server fall back to non-locking
  transactional claims and are not supported for multi-instance durable
  dispatch by the first-party MikroORM adapter
- `cap_received` inbox entity/table with unique `(group, dedupeKey)`
- inbox retry/dead-letter state with `status`, `lastError`, and `processedAt`
- `savePublish(event, ctx?)` for transaction-aware outbox persistence
- deprecated `savePublishWithTx(event, tx)` compatibility wrapper
- conservative `getCapabilities()` reporting through
  `CapabilityAwareStoragePort`
- dashboard list/find helpers for outbox and inbox records
- optional initialization through MikroORM schema generation

Existing databases need a migration when upgrading to this shape: add the new
inbox state columns and replace the old `(topic, group, messageId)` unique
index with `(group, dedupeKey)`.

## First-Party Storage: Knex

Package: `@mikara89/cap-storage-knex`

The Knex adapter provides:

- `KnexPublishStorage` for outbox rows with retry, lease, and dead-letter state
- `KnexReceivedStorage` for inbox rows with unique `(group, dedupeKey)`
- `createKnexCapSchema(knex, options?)` for table and index creation
- configurable publish and received table names
- `savePublish(event, ctx?)` using `ctx.tx` when a Knex transaction is supplied
- deprecated `savePublishWithTx(event, tx)` compatibility wrapper
- `KnexTransactionManager` for `CapTransactionManagerPort<Knex.Transaction>`
- conservative `getCapabilities()` reporting through
  `CapabilityAwareStoragePort`
- dashboard list/find helpers for outbox and inbox records

PostgreSQL and MySQL/MariaDB clients use Knex row locking with `skipLocked()`
for outbox claiming when available. SQLite is supported for local development
and tests, but it reports non-safe multi-instance claiming and should not be
used for multi-instance durable dispatch without an application-specific
locking strategy.

## First-Party Storage: TypeORM

Package: `@mikara89/cap-storage-typeorm`

The TypeORM adapter provides:

- `TypeOrmPublishStorage` for outbox rows with retry, lease, and dead-letter
  state
- `TypeOrmReceivedStorage` for inbox rows with unique `(group, dedupeKey)`
- `createTypeOrmCapSchema(dataSource, options?)` for table and index creation
- configurable publish and received table names
- `savePublish(event, ctx?)` using `ctx.tx` when a TypeORM `EntityManager` is
  supplied
- deprecated `savePublishWithTx(event, manager)` compatibility wrapper
- `TypeOrmTransactionManager` for
  `CapTransactionManagerPort<EntityManager>`
- conservative `getCapabilities()` reporting through
  `CapabilityAwareStoragePort`
- dashboard list/find helpers for outbox and inbox records

PostgreSQL and MySQL/MariaDB data sources use TypeORM pessimistic write locking
with `skip_locked` for outbox claiming when available. SQLite is supported for
local development and tests, but it reports non-safe multi-instance claiming and
should not be used for multi-instance durable dispatch without an
application-specific locking strategy.

## First-Party Storage: Prisma

Package: `@mikara89/cap-storage-prisma`

The Prisma adapter provides:

- `PrismaPublishStorage` and `PrismaReceivedStorage` backed by parameterized
  raw SQL rather than generated model delegates
- `initializePrismaCapStorage(client, options)` for table, constraint, and
  index creation without adding CAP models to the application Prisma schema
- explicit PostgreSQL, MySQL/MariaDB, and SQLite provider options
- strict validation and provider-aware quoting for configurable table names
- `savePublish(event, ctx?)` using `ctx.tx` when a Prisma interactive
  transaction client is supplied
- deprecated `savePublishWithTx(event, tx)` compatibility wrapper
- `PrismaTransactionManager` for
  `CapTransactionManagerPort<Prisma.TransactionClient>`
- atomic inbox insert-ignore with unique `(group, dedupeKey)` enforcement
- dashboard list/find helpers and conservative capability reporting

PostgreSQL and MySQL/MariaDB use explicit `FOR UPDATE SKIP LOCKED` outbox
claiming and are covered by Testcontainers integration tests. SQLite is a
local/test fallback and does not report safe multi-instance claiming. Users may
run the initializer or manage equivalent CAP tables with their own migrations.

## First-Party Framework Adapter: Express

Package: `@mikara89/cap-express`

The Express adapter provides:

- `createCapExpress` for explicit CAP lifecycle management
- `start()` and `stop()` methods for application-owned startup/shutdown
- `healthRouter()` with simple process and CAP health endpoints
- direct delegation to the framework-agnostic `CapEngine`

## First-Party Transport: Azure Service Bus

Package: `@mikara89/cap-transport-azure-servicebus`

The Azure Service Bus adapter provides:

- publisher backed by `ServiceBusClient.createSender`
- subscriber backed by `ServiceBusClient.createReceiver`
- topic/subscription mode and queue mode
- broker `messageId` propagation for inbox deduplication
- optional queue/topic provisioning when initialization is enabled

## First-Party Transport: NestJS Microservices

Package: `@mikara89/cap-transport-nestjs-microservices`

This adapter lets applications reuse existing `@nestjs/microservices`
`ClientProxy` registrations while CAP keeps durable outbox/inbox state,
retries, and dashboard visibility.

Important reliability note: `ClientProxy.emit()` semantics vary by broker and
configuration. CAP treats completion as client-library acceptance, not a
portable durable broker acknowledgment.

## First-Party Transport: RabbitMQ

Package: `@mikara89/cap-transport-rabbitmq`

The RabbitMQ adapter provides:

- a framework-neutral `amqplib` publisher and subscriber
- persistent JSON publishing to a durable topic exchange
- publisher confirms with timeout, nack propagation, and channel-drain handling
- durable group queues, topic bindings, prefetch, and manual acknowledgements
- classic queues by default and opt-in quorum/dead-letter arguments
- bounded reconnect with topology, binding, and consumer restoration
- fail-fast publishes while disconnected; no hidden reconnect buffer

A publisher confirmation proves broker acceptance only. It does not prove a
queue matched or a consumer processed the message. Mandatory publishing remains
disabled because returned-message correlation is not implemented.

CAP inbox retries remain authoritative. The adapter acknowledges after the CAP
inbound callback resolves, including when CAP has persisted an application
handler failure for inbox retry. Boundary rejection nacks without requeue by
default. Malformed payloads are never requeued indefinitely.

## First-Party Transport: Kafka

Package: `@mikara89/cap-transport-kafka`

The Kafka adapter publishes JSON with CAP headers, content type, and message
identity through the maintained `@confluentinc/kafka-javascript` client.
Producer acks are configurable and default to all in-sync replicas. Consumers
use native groups with auto-commit disabled: offsets advance only after handler
success. Handler failure is propagated without a commit. Malformed messages are
logged, skipped, and committed once to prevent poison-message loops. Topic
creation is opt-in and configurable, so ordinary runtime needs no admin access.

## Adapter Authoring Rules

- Bind and export the CAP Symbol tokens, not string literals.
- Implement claim/lease outbox dispatch atomically for production stores.
- Run the publish-storage contract tests from `@mikara89/cap-testing`.
- Run the received-storage contract tests from `@mikara89/cap-testing`.
- Run the transport contract tests from `@mikara89/cap-testing` for transport
  adapters.
- Implement `CapabilityAwareStoragePort` when the adapter can report its
  behavior without guessing.
- Enforce inbox idempotency with a stable `dedupeKey`.
- Preserve payload and headers without transport-specific coupling.
- Return due inbox retries only when `status = failed` and `nextRetry <= now`.
- Provide dashboard list/find helpers for production adapters.
- Document resource naming, provisioning, and failure semantics.

See the [transport adapter author guide](transport-adapter-author-guide.md) for
the verified common contract and settlement boundary.
