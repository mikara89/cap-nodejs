# Adapters

CAP keeps storage and transport behind small interfaces so applications can
choose the database and broker that fit their environment.

## Contracts

Storage adapters bind:

- `PUBLISH_STORAGE` with an `IPublishStorage`
- `RECEIVED_STORAGE` with an `IReceivedStorage`

Transport adapters bind:

- `PUBLISHER` with an `IPublisher`
- `SUBSCRIBER` with an `ISubscriber`

Adapter modules can be registered with `CapModule.forAdapters(...)` when they
expose Nest providers for those tokens.

## Storage Responsibilities

`IPublishStorage` stores outbox records:

- `savePublish(event)`
- `markPublished(id)`
- `getUnpublished(limit)`
- optional `initialize(options)`
- optional dashboard helpers: `findPublishById`, `listPublish`
- optional transaction helper: `savePublishWithTx`

`IReceivedStorage` stores inbox records:

- `saveReceived(event)`
- `markProcessed(id)`
- `scheduleRetry(id, retryCount, nextRetry)`
- `getRetryDue(limit)`
- optional `initialize(options)`
- optional dashboard helpers: `findReceivedById`, `listReceived`

## Transport Responsibilities

`IPublisher` emits messages to a broker:

- `emit(topic, payload, headers?, tx?)`
- optional `initialize(options)`

`ISubscriber` attaches consumers:

- `consume(topic, group, onMessage(payload, headers?))`
- optional `initialize(options)`

Transports that can coordinate with a transaction may also implement
`emitWithTx(topic, payload, headers, tx)`.

Headers are CAP transport metadata. First-party transports preserve primitive
header values: `string`, `number`, `boolean`, and `Date`.

## First-Party Storage: MikroORM

Package: `@mikara89/mikroorm-storage`

The MikroORM adapter provides:

- `cap_publish` outbox entity/table
- `cap_received` inbox entity/table
- core publish and received storage methods
- `savePublishWithTx` for transactional outbox persistence
- dashboard list/find helpers for outbox and inbox records
- optional initialization through MikroORM schema generation

## First-Party Transport: Azure Service Bus

Package: `@mikara89/azure-servicebus-transport`

The Azure Service Bus adapter provides:

- publisher backed by `ServiceBusClient.createSender`
- subscriber backed by `ServiceBusClient.createReceiver`
- topic/subscription mode and queue mode
- optional queue/topic provisioning when initialization is enabled

Use environment variables for connection strings:

```ts
ServiceBusTransportModule.forRoot({
  connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
  topicPrefix: 'cap-',
  subscriptionPrefix: 'sub-',
});
```

Do not commit real connection strings.

## First-Party Transport: NestJS Microservices

Package: `@mikara89/nestjs-microservices-transport`

This adapter lets applications reuse existing `@nestjs/microservices`
`ClientProxy` registrations while CAP keeps durable
outbox/inbox state, retries, and dashboard visibility.

Intended role:

- CAP persists the outbox row before publish.
- CAP scheduler/retry logic decides when unpublished rows are retried.
- The NestJS microservices adapter delegates the actual emit to a configured
  `ClientProxy`.
- Inbound messages are bridged by application-owned `@EventPattern` handlers
  calling `CapMicroservicesBridge.dispatch(topic, group, message)`.

Important reliability note: `ClientProxy.emit()` semantics vary by broker and
configuration. CAP treats completion as client-library acceptance, not a
portable durable broker acknowledgment. Broker-aware adapters such as Azure
Service Bus can offer stronger transport-specific behavior where needed.

## Initialization

`CapModule` accepts optional initialization flags and forwards them to adapters
that implement `initialize(options)`:

```ts
CapModule.forAdapters(storageModule, transportModule, {
  createSchema: false,
  createQueues: false,
});
```

Recommended production default is to keep automatic schema and broker
provisioning disabled and manage those resources through migrations and
infrastructure tooling.

## Adapter Authoring Rules

- Bind the exported Symbol tokens, not string literals.
- Keep storage durable and idempotent where possible.
- Preserve payload and headers without transport-specific coupling.
- Return due inbox retries only when `processed = false` and `nextRetry <= now`.
- Provide dashboard list/find helpers for any production adapter.
- Document resource naming, provisioning, and failure semantics.
