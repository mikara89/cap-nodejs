# Adapters

CAP keeps storage and transport behind NestJS dependency-injection tokens so
applications can choose the database and broker that fit their environment.

## Registration

Storage and transport adapters should be regular Nest modules that export the
CAP tokens they provide:

- `PUBLISH_STORAGE` with an `IPublishStorage`
- `RECEIVED_STORAGE` with an `IReceivedStorage`
- `PUBLISHER` with an `IPublisher`
- `SUBSCRIBER` with an `ISubscriber`

Register those modules with CAP through real module imports:

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

`IPublishStorage` stores outbox records and must support durable claim/lease
dispatch:

- `savePublish(event)`
- `claimUnpublished({ limit, lockedBy, lockUntil, now })`
- `markPublished(id, publishedAt?)`
- `markPublishFailed(id, error, { maxRetries, nextRetryAt, now })`
- `releaseExpiredClaims(now)`
- optional `initialize(options)`
- optional dashboard helpers: `findPublishById`, `listPublish`
- optional transaction helper: `savePublishWithTx`

`IReceivedStorage` stores inbox records with dedupe-key idempotency and
dead-letter-aware retry state:

- `trySaveReceived(event)` returning `{ inserted, id, event }`
- `markProcessed(id)`
- `markReceivedFailed(id, error, { maxRetries, nextRetryAt, now })`
- `getRetryDue(limit)`
- optional `initialize(options)`
- optional dashboard helpers: `findReceivedById`, `listReceived`

## Transport Responsibilities

`IPublisher` emits messages to a broker:

- `emit(topic, payload, headers?, { messageId })`
- optional `initialize(options)`

`ISubscriber` attaches consumers:

- `consume(topic, group, onMessage(payload, headers?, metadata?))`
- optional `initialize(options)`

Subscriber metadata should include a stable `messageId` when the broker exposes
one. If a transport can provide a stronger idempotency identity, it should pass
`dedupeKey`; CAP stores `messageId` for traceability but first-party durable
storage deduplicates by consumer group and `dedupeKey`.

Headers are CAP transport metadata. First-party transports preserve primitive
header values: `string`, `number`, `boolean`, and `Date`.

## First-Party Storage: MikroORM

Package: `@mikara89/mikroorm-storage`

The MikroORM adapter provides:

- `cap_publish` outbox entity/table with retry, lease, and dead-letter state
- lock-based outbox claiming; production use requires a MikroORM SQL driver
  that supports pessimistic partial write locking, or a custom storage adapter
- SQLite/local demo drivers fall back to non-locking transactional claims and
  are not supported for multi-instance durable dispatch
- `cap_received` inbox entity/table with unique `(group, dedupeKey)`
- inbox retry/dead-letter state with `status`, `lastError`, and `processedAt`
- `savePublishWithTx` for transactional outbox persistence
- dashboard list/find helpers for outbox and inbox records
- optional initialization through MikroORM schema generation

Existing databases need a migration when upgrading to this shape: add the new
inbox state columns and replace the old `(topic, group, messageId)` unique
index with `(group, dedupeKey)`.

## First-Party Transport: Azure Service Bus

Package: `@mikara89/azure-servicebus-transport`

The Azure Service Bus adapter provides:

- publisher backed by `ServiceBusClient.createSender`
- subscriber backed by `ServiceBusClient.createReceiver`
- topic/subscription mode and queue mode
- broker `messageId` propagation for inbox deduplication
- optional queue/topic provisioning when initialization is enabled

## First-Party Transport: NestJS Microservices

Package: `@mikara89/nestjs-microservices-transport`

This adapter lets applications reuse existing `@nestjs/microservices`
`ClientProxy` registrations while CAP keeps durable outbox/inbox state,
retries, and dashboard visibility.

Important reliability note: `ClientProxy.emit()` semantics vary by broker and
configuration. CAP treats completion as client-library acceptance, not a
portable durable broker acknowledgment.

## Adapter Authoring Rules

- Bind and export the CAP Symbol tokens, not string literals.
- Implement claim/lease outbox dispatch atomically for production stores.
- Enforce inbox idempotency with a stable `dedupeKey`.
- Preserve payload and headers without transport-specific coupling.
- Return due inbox retries only when `status = failed` and `nextRetry <= now`.
- Provide dashboard list/find helpers for production adapters.
- Document resource naming, provisioning, and failure semantics.
