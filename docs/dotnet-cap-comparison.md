# CAP Node.js and DotNetCore.CAP

> **Revision-specific comparison.** This comparison reflects the repository
> revisions in [Verification revisions](#verification-revisions). Both projects
> continue to evolve, so a capability status may change after those revisions.

## Relationship and attribution

CAP Node.js is inspired by the architecture and operating model of
[DotNetCore.CAP](https://github.com/dotnetcore/CAP), including durable
outbox/inbox persistence, broker-based publish/subscribe, consumer groups,
background retries, and operational message management.

CAP Node.js is an independent TypeScript implementation for the Node.js
ecosystem. It is not an official DotNetCore.CAP port, is not affiliated with or
endorsed by the DotNetCore.CAP maintainers, and does not guarantee API,
database-schema, wire-format, or behavioral compatibility. It is not a drop-in
replacement and is not described as feature-complete with DotNetCore.CAP.

## Shared architectural model

Both projects use durable records to bridge an application database and a
broker: application transaction, published/outbox record, background dispatch,
broker consumer group, received/inbox record, subscriber execution, then
success, retry, or terminal failure. Similar architecture does not make record
schemas, status names, transport bodies, or public APIs interoperable.

## Delivery semantics

Messaging and subscriber processing use **at-least-once** semantics. Under
failures, retries, broker redelivery, stale-message recovery, or process
crashes, application work may execute more than once. Neither project provides
general end-to-end exactly-once delivery.

Subscriber work must be idempotent. Applications can use unique business
constraints, set-to-value updates, processed-operation IDs, and external API
idempotency keys; CAP Node.js does not automatically provide these mechanisms.
CAP Node.js intentionally does not atomically commit subscriber business state
and received/inbox processed state. This nontransactional consume/retry design
is not a DotNetCore.CAP compatibility guarantee.

## Subscriber and consumer-group behavior

A logical subscription is scoped by **topic and consumer group**. Groups are
independent. For `order.created` with `billing`, `inventory`, `email`, and
`analytics`, a failure in `email` yields this conceptual outcome:

```text
billing    processed
inventory  processed
email      failed / retried
analytics  processed
```

Only `email` retries; no global transaction rolls successful groups back.
Instances consuming the same topic and group are competing consumers/load
balanced according to their broker. CAP Node.js also rejects duplicate local
`(topic, group)` handler registration in one engine process; that is not a
broker-wide uniqueness guarantee.

## Retry and recovery model

CAP Node.js retries durable failed inbox/outbox rows and recovers stale inbox
`pending` rows older than `scheduler.inboxFallbackWindowMs` (four minutes by
default). A too-short window can duplicate slow/backlogged handler work.
DotNetCore.CAP documents recovery of `Scheduled` and `Failed` records via
`FallbackWindowLookbackSeconds`. CAP Node.js `pending`/`failed` terminology and
schemas are independent.

DotNetCore.CAP has an optional database retry-scanner lock (`UseStorageLock`).
CAP Node.js instead has fenced claim/lease ownership for first-party **outbox**
dispatch where storage supports it. Inbox retry has no transaction-held,
per-message claim through handler completion, so CAP Node.js does not guarantee
exactly one inbox retry across a cluster. Scanner coordination and handler
ownership are different concerns.

## Feature-status methodology

| Label               | Meaning                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Supported**       | Implemented and backed by current code plus tests or current first-party documentation. |
| **Partial**         | Implemented with meaningful provider, framework, concurrency, or operational limits.    |
| **Different model** | Both projects address it with materially different APIs or semantics.                   |
| **Not supported**   | No implementation exists in current code.                                               |
| **Planned**         | Explicitly on the current CAP Node.js roadmap but absent from implementation.           |
| **Not verified**    | Evidence is insufficient to make a responsible claim.                                   |

CAP Node.js entries prioritize implementation and tests, then first-party docs.
Roadmap evidence supports only `Planned`. DotNetCore.CAP entries use only the
official sources linked below.

## Side-by-side capability matrix

### Foundation and publishing

| Capability                          | CAP Node.js                                                                                        | DotNetCore.CAP                                                              | Important difference                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| Language/runtime                    | **Supported** — TypeScript/Node.js.                                                                | **Supported** — .NET.                                                       | Separate ecosystems.                                 |
| Framework-neutral core              | **Supported** — `cap-core` ports.                                                                  | **Supported** — standalone event-bus use.                                   | APIs differ.                                         |
| Primary framework integration       | **Supported** — NestJS; Express too.                                                               | **Supported** — ASP.NET Core DI/middleware.                                 | Framework APIs differ.                               |
| Modular package architecture        | **Supported** — independent npm packages.                                                          | **Supported** — NuGet providers.                                            | Versions are not comparable.                         |
| Durable outbox/published storage    | **Supported**.                                                                                     | **Supported**.                                                              | Schemas differ.                                      |
| Durable inbox/received storage      | **Supported**.                                                                                     | **Supported**.                                                              | CAP Node.js uses `(group, dedupeKey)`.               |
| At-least-once processing            | **Supported**.                                                                                     | **Supported**.                                                              | Idempotency remains required.                        |
| Exactly-once end-to-end             | **Not supported**.                                                                                 | **Not supported**.                                                          | Never claimed.                                       |
| Custom headers                      | **Supported** — primitive headers.                                                                 | **Supported**.                                                              | Header mappings differ.                              |
| Versioned envelope/interoperability | **Different model** — v1 envelope only at a CAP Node.js transport boundary lacking native headers. | **Supported** — CAP version/wrapper format.                                 | No wire compatibility claim.                         |
| Publish outside transaction         | **Supported**.                                                                                     | **Supported**.                                                              | Durable record precedes broker work.                 |
| Transaction-aware outbox            | **Supported** — `tx`/`ctx`.                                                                        | **Supported**.                                                              | Provider APIs differ.                                |
| Explicit transaction handle         | **Supported** — `tx`/`ctx.tx`.                                                                     | **Supported** — ADO.NET/EF integration.                                     | Adapter-owned types in Node.js.                      |
| Ambient transaction integration     | **Supported** — optional manager/context.                                                          | **Supported**.                                                              | Semantics are unrelated.                             |
| Immediate broker attempt            | **Supported** — `immediate: true`, non-atomic.                                                     | **Supported**.                                                              | DB+broker atomicity is not claimed.                  |
| Deferred/background dispatch        | **Supported**.                                                                                     | **Supported**.                                                              | Scheduler implementation differs.                    |
| Delayed/scheduled messages          | **Not supported**.                                                                                 | **Supported** — `PublishDelayAsync`.                                        | CAP Node.js public ports omit this.                  |
| Bulk publish                        | **Not supported**.                                                                                 | **Not verified**.                                                           | No public API claim.                                 |
| Callback/response/compensation      | **Not supported** — no portable request/reply/callback port.                                       | **Supported** — official messaging docs cover compensating/callback fields. | CAP Node.js makes no shared request/reply guarantee. |

### Subscribers and recovery

| Capability                         | CAP Node.js                                                                   | DotNetCore.CAP                                                   | Important difference                        |
| ---------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| Topic subscriptions                | **Supported**.                                                                | **Supported**.                                                   | APIs differ.                                |
| Consumer groups                    | **Supported**.                                                                | **Supported**.                                                   | Independent group outcomes.                 |
| Fan-out across groups              | **Supported**.                                                                | **Supported**.                                                   | No cross-group transaction.                 |
| Competing consumers in one group   | **Partial** — broker-specific implementation.                                 | **Supported**.                                                   | No portable broker uniformity claim.        |
| Local duplicate handlers           | **Supported** — duplicate `(topic, group)` throws.                            | **Not verified**.                                                | CAP Node.js process-local constraint.       |
| Subscriber concurrency controls    | **Partial** — transport prefetch/client behavior varies; no common core knob. | **Supported** — documented thread/parallel controls.             | No CAP Node.js equivalent.                  |
| Subscriber filters/middleware      | **Not supported**.                                                            | **Supported**.                                                   | No shared Node.js filter port.              |
| Wildcard subscriptions             | **Not supported**.                                                            | **Supported** — wildcard/partial subscriptions.                  | Explicit topics in CAP Node.js.             |
| Immediate retry                    | **Partial** — scheduler-oriented retry, no general same-call policy.          | **Supported**.                                                   | Timing models differ.                       |
| Background retry                   | **Supported**.                                                                | **Supported**.                                                   | Both persist failure state.                 |
| Stale pending/scheduled recovery   | **Partial** — stale `pending` recovery, slow-subscriber caveat.               | **Supported** — `Scheduled`/`Failed` lookback.                   | Status terms differ.                        |
| Dead-letter/terminal failure       | **Supported** — `dead_letter`.                                                | **Supported**.                                                   | Retention differs.                          |
| Idempotency responsibility         | **Supported** — documented.                                                   | **Supported** — official guidance.                               | No exactly-once claim.                      |
| Transactional inbox atomicity      | **Not supported**.                                                            | **Not verified** as a business-state-plus-inbox atomic contract. | CAP Node.js intentionally lacks it.         |
| Configurable retry count           | **Supported**.                                                                | **Supported**.                                                   | Defaults differ.                            |
| Configurable retry interval        | **Partial** — scheduler policy, no same named interval option.                | **Supported** — `FailedRetryInterval`.                           | CAP Node.js uses backoff.                   |
| Retry backoff                      | **Supported** — exponential.                                                  | **Not verified**.                                                | Do not infer .NET algorithm.                |
| Retry jitter                       | **Supported**.                                                                | **Not verified**.                                                | CAP Node.js policy is explicit.             |
| Fallback/stale window              | **Supported** — `inboxFallbackWindowMs`.                                      | **Supported** — `FallbackWindowLookbackSeconds`.                 | Same default duration is not compatibility. |
| Multi-instance retry coordination  | **Partial** — inbox lacks per-message ownership.                              | **Supported** — optional DB scanner lock.                        | Coordination is not handler ownership.      |
| Outbox per-message claim ownership | **Partial** — fenced leases with PostgreSQL/MySQL real-DB coverage.           | **Not verified** as equivalent fencing.                          | CAP Node.js explicit ownership boundary.    |
| Inbox per-message claim ownership  | **Not supported**.                                                            | **Not verified**.                                                | No equivalence claim.                       |
| Failure threshold callback         | **Not supported**.                                                            | **Supported** — `FailedThresholdCallback`.                       | Diagnostics are not threshold callbacks.    |
| Manual inbox retry/requeue         | **Supported** — `requeueInbox(id)`.                                           | **Supported** — dashboard/manual retry.                          | CAP Node.js API is dashboard-independent.   |
| Manual outbox retry/requeue        | **Supported** — `requeueOutbox(id)`.                                          | **Supported** — dashboard/manual retry.                          | Semantics not assumed identical.            |
| Successful-message cleanup         | **Not supported**.                                                            | **Supported** — expiry/collector cleanup.                        | Storage lifecycle differs.                  |
| Failed-message retention/cleanup   | **Not supported**.                                                            | **Supported**.                                                   | No shared retention policy.                 |

### Administration, storage, and transports

| Capability                                | CAP Node.js                                                     | DotNetCore.CAP                                                     | Important difference                               |
| ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| Message lookup                            | **Supported** — first-party administration capability.          | **Supported** — dashboard/runtime.                                 | CAP Node.js core-facing API.                       |
| Inbox/outbox counts and oldest timestamps | **Supported** — `getMessagingSnapshot()`.                       | **Supported** — dashboard statistics.                              | Node snapshot is not a cross-table transaction.    |
| Framework-neutral administration API      | **Supported** — requeue/snapshot methods.                       | **Different model** — dashboard/runtime-led operations.            | CAP Node.js works without dashboard.               |
| Manual dashboard retry                    | **Supported**.                                                  | **Supported**.                                                     | Application owns authorization.                    |
| Force replay successful records           | **Not supported**.                                              | **Not verified**.                                                  | CAP Node.js excludes processed/published.          |
| Bulk retry/requeue                        | **Not supported**.                                              | **Not verified**.                                                  | No public API claim.                               |
| In-memory storage                         | **Supported**.                                                  | **Supported**.                                                     | Not durable production storage.                    |
| PostgreSQL                                | **Supported** — all current storage styles; real claim tests.   | **Supported**.                                                     | Adapter/use-case dependent.                        |
| MySQL/MariaDB                             | **Supported** — first-party providers; MySQL claim tests.       | **Supported** — MySQL.                                             | MariaDB is provider-specific.                      |
| SQLite                                    | **Partial** — local/test, not safe multi-instance outbox claim. | **Not verified** built-in; official docs name community extension. | Never infer cluster safety.                        |
| SQL Server                                | **Partial** — no first-party safe multi-instance claim path.    | **Supported**.                                                     | Provider support is not claim guarantee.           |
| MongoDB                                   | **Not supported**.                                              | **Supported**.                                                     | Mongoose is only future candidate.                 |
| MikroORM                                  | **Supported** — first-party ORM adapter.                        | **Not supported** as reviewed provider style.                      | Abstraction layer, not DB.                         |
| Knex                                      | **Supported** — first-party query-builder adapter.              | **Not supported**.                                                 | Does not imply every DB guarantee.                 |
| TypeORM                                   | **Supported** — first-party ORM adapter.                        | **Not supported**.                                                 | Not EF Core.                                       |
| Prisma                                    | **Supported** — first-party raw-SQL adapter.                    | **Not supported**.                                                 | No CAP model requirement.                          |
| EF Core                                   | **Not supported**.                                              | **Supported**.                                                     | .NET integration style.                            |
| ADO.NET/native transaction integration    | **Not supported** as Node API.                                  | **Supported**.                                                     | Node uses adapter transaction objects.             |
| In-memory transport                       | **Supported**.                                                  | **Supported**.                                                     | Not distributed/durable broker.                    |
| RabbitMQ                                  | **Supported** — package, contract, broker integration test.     | **Supported**.                                                     | No topology/wire equivalence.                      |
| Kafka                                     | **Supported** — package, contract, broker integration test.     | **Supported**.                                                     | Not exactly-once processing.                       |
| Azure Service Bus                         | **Supported** — package, contract, integration path.            | **Supported**.                                                     | Settlement/provisioning adapter-specific.          |
| AWS SNS/SQS topology                      | **Supported** — SNS publish/SQS receive.                        | **Not supported** under reviewed provider names.                   | Not plain Amazon SQS.                              |
| Amazon SQS                                | **Not supported** as plain transport.                           | **Supported**.                                                     | CAP Node.js requires SNS/SQS topology.             |
| NestJS microservices bridge               | **Supported**.                                                  | **Not supported**.                                                 | ClientProxy acceptance is not portable broker ack. |
| NATS                                      | **Planned** — NATS JetStream v2.5 candidate.                    | **Supported**.                                                     | No CAP Node.js package.                            |
| Redis Streams                             | **Planned** — later/optional candidate.                         | **Supported**.                                                     | No CAP Node.js package.                            |
| Apache Pulsar                             | **Not supported**.                                              | **Supported**.                                                     | No CAP Node.js roadmap commitment found.           |
| Google Pub/Sub                            | **Planned** — v2.5 candidate.                                   | **Not supported** in reviewed official provider lists.             | No CAP Node.js implementation.                     |

### Frameworks, observability, and extensibility

| Capability                            | CAP Node.js                                                                  | DotNetCore.CAP                                           | Important difference                        |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| Framework-neutral usage               | **Supported** — `cap-core`.                                                  | **Supported**.                                           | Core APIs differ.                           |
| NestJS / Express                      | **Supported**.                                                               | **Not supported**.                                       | First-party Node integrations.              |
| ASP.NET Core                          | **Not supported**.                                                           | **Supported**.                                           | First-party .NET integration.               |
| Decorator/attribute subscription      | **Supported** — Nest decorators.                                             | **Supported** — `[CapSubscribe]`.                        | Metadata systems differ.                    |
| Dependency injection/lifecycle        | **Supported** — Nest lifecycle, explicit Express start/stop.                 | **Supported** — .NET DI/hosting.                         | APIs differ.                                |
| Health endpoints                      | **Supported** — Express health router.                                       | **Not verified** as generic feature.                     | Do not infer from dashboard.                |
| Dashboard integration                 | **Supported** — core/Nest/Express dashboard packages.                        | **Supported**.                                           | Node admin API can be headless.             |
| Framework-neutral typed diagnostics   | **Supported** — `CapMessagingDiagnosticsPort`.                               | **Different model** — .NET native diagnostics.           | Semantic port vs native instrumentation.    |
| DiagnosticSource                      | **Not supported**.                                                           | **Supported**.                                           | .NET API.                                   |
| EventSource/metrics                   | **Planned** — metrics/tracing roadmap item.                                  | **Supported**.                                           | CAP Node.js has no built-in metrics.        |
| OpenTelemetry                         | **Not supported**.                                                           | **Supported** — first-party package.                     | External sinks are not first-party support. |
| Dashboard metrics                     | **Not verified**.                                                            | **Supported**.                                           | Node dashboard graphs are not claimed.      |
| Logging hooks                         | **Supported** — logger port and diagnostics failure logging.                 | **Supported**.                                           | APIs differ.                                |
| Payload privacy in diagnostics        | **Supported** — typed events exclude payload/headers.                        | **Not verified** equivalent default.                     | Explicit Node privacy boundary.             |
| Service discovery                     | **Not supported**.                                                           | **Supported** — Consul/Kubernetes dashboard integration. | No Node package.                            |
| Storage adapter extension interface   | **Supported** — ports/capabilities.                                          | **Supported** — provider model.                          | Contracts differ.                           |
| Transport adapter extension interface | **Supported** — publisher/subscriber ports.                                  | **Supported** — provider model.                          | Contracts differ.                           |
| Shared storage contract suite         | **Supported** — `@mikara89/cap-testing`.                                     | **Not verified** equivalent public suite.                | Explicit Node suite.                        |
| Shared transport contract suite       | **Supported** — `defineTransportContract()`.                                 | **Not verified** equivalent public suite.                | Explicit Node suite.                        |
| Real database integration gates       | **Supported** — PostgreSQL/MySQL outbox claim gate.                          | **Not verified** reviewed CI equivalence.                | Narrow evidence only.                       |
| Real broker integration gates         | **Supported** — RabbitMQ, Kafka, AWS SNS/SQS, Service Bus scripts/workflows. | **Not verified** reviewed CI equivalence.                | No reliability equivalence.                 |
| Compile-checked examples              | **Supported** — `examples:check`.                                            | **Not verified**.                                        | Repository-script evidence.                 |
| Framework-neutral storage roots       | **Supported** — Knex/TypeORM/Prisma roots; `/nest` boundary.                 | **Different model**.                                     | Node package boundary is explicit.          |
| Independent adapter packages          | **Supported** — npm independent versions.                                    | **Supported** — provider packages.                       | Milestone is not package version.           |

## Important design differences

- **Administration:** `requeueInbox(id)`, `requeueOutbox(id)`, and
  `getMessagingSnapshot()` are framework-neutral application APIs. Requeue only
  accepts `failed`/`dead_letter` records, never successful
  `processed`/`published` records, and returns work to the normal scheduler
  rather than executing it synchronously. DotNetCore.CAP management is
  prominently dashboard/storage/runtime based.
- **Diagnostics:** CAP Node.js has the best-effort, non-durable, non-blocking
  `CapMessagingDiagnosticsPort` with `inbox.processed`, `inbox.failed`,
  `inbox.dead_lettered`, `inbox.retried`, `inbox.manually_requeued`,
  `outbox.published`, `outbox.failed`, `outbox.dead_lettered`,
  `outbox.retried`, and `outbox.manually_requeued`. These exclude payloads and
  headers; sink failure cannot affect correctness. DotNetCore.CAP's
  DiagnosticSource, EventSource/metrics, dashboard metrics, and OpenTelemetry
  integration are a different model, not the same API.
- **Versions:** a CAP Node.js roadmap milestone is not an `@mikara89/*` package
  version. Packages use independent npm versions; this document does not map a
  roadmap milestone to a DotNetCore.CAP NuGet version.

## Current limitations

CAP Node.js has no transactional inbox, delayed delivery, portable filters or
wildcards, automatic cleanup/retention, failure threshold callback, plain
Amazon SQS transport, MongoDB storage, service discovery, or first-party
OpenTelemetry/metrics. NATS JetStream and Google Pub/Sub are planned, not
implemented. SQL Server and SQLite are not safe first-party multi-instance
outbox claim implementations merely because an ORM/query builder can target
them.

## Source references

### CAP Node.js

- [Root README](../README.md), [architecture](architecture.md),
  [transactions](transactions.md), [diagnostics](diagnostics.md), and
  [adapters](adapters.md).
- `libs/cap-core/src/engine/cap-engine.ts`, `cap-engine.spec.ts`,
  `cap-engine.administration.spec.ts`, `cap-engine.diagnostics.spec.ts`, and
  `libs/cap-testing/src/contracts/`.
- Storage/transport package tests, `package.json`, and
  `.github/workflows/ci.yml` for contract and integration gates.

### DotNetCore.CAP

- [Official repository](https://github.com/dotnetcore/CAP) and
  [README](https://github.com/dotnetcore/CAP#readme).
- Official [configuration/retries](https://cap.dotnetcore.xyz/user-guide/en/cap/configuration/),
  [transactions](https://cap.dotnetcore.xyz/user-guide/en/cap/transactions/),
  [messaging/retention](https://cap.dotnetcore.xyz/user-guide/en/cap/messaging/),
  [idempotence](https://cap.dotnetcore.xyz/user-guide/en/cap/idempotence/),
  [storage](https://cap.dotnetcore.xyz/user-guide/en/storage/general/),
  [transports](https://cap.dotnetcore.xyz/user-guide/en/transport/general/),
  [dashboard](https://cap.dotnetcore.xyz/user-guide/en/monitoring/dashboard/),
  [diagnostics](https://cap.dotnetcore.xyz/user-guide/en/monitoring/diagnostics/),
  and [OpenTelemetry](https://cap.dotnetcore.xyz/user-guide/en/monitoring/opentelemetry/).
- [NuGet metadata for DotNetCore.CAP 10.0.1](https://www.nuget.org/packages/DotNetCore.CAP/10.0.1).

## Verification revisions

CAP Node.js:

- commit: `6a6fd6ef1431461667ef350702d01aa6fdfca891`
- verified: `2026-07-25`

DotNetCore.CAP:

- commit: `e52b8508e54cdb7a9ce7f9fec03d9ea8ad2710fb` (official `master` HEAD)
- tag/version reference: `v10.0.1` / `10.0.1` (`649c9c49afb3c491f66178b832128039ae7d5c82`)
- verified: `2026-07-25`
