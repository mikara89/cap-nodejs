# Roadmap

This roadmap tracks delivery maturity. ADRs capture decisions; this document
captures remaining work.

## MVP

MVP means CAP can be used as a complete reliable messaging library in a NestJS
application with first-party storage, transport, dashboard, docs, and tests.

Included in MVP:

- Core publish/subscribe flow with outbox and inbox persistence.
- Retry scheduler for unpublished outbox records and due inbox retries.
- MikroORM storage adapter.
- Azure Service Bus transport adapter.
- NestJS microservices transport adapter: `@mikara89/cap-transport-nestjs-microservices`
  for applications that already use `@nestjs/microservices` `ClientProxy`
  registrations.
- Dashboard REST API and static UI for inspection and admin actions.
- Clean documentation and ADRs.
- Passing test suite for core behavior and first-party package behavior.

MVP closure status:

- `CapHeaders` is included in MVP as primitive transport metadata and can be
  read through `@CapHeaders()` or the second handler argument.
- External Azure Service Bus coverage is split into an explicit integration
  gate: `npm run test:integration:servicebus`.
- `@mikara89/cap-transport-nestjs-microservices` is implemented with documented
  `ClientProxy.emit()` acknowledgment limitations.
- Dashboard authentication remains application-owned, with an operation-aware
  authorizer hook for read versus admin actions.
- The first public package set is aligned on stable `0.7.0`.
- PostgreSQL/MySQL durable outbox claim concurrency is covered by
  `npm run test:integration:db` and the CI DB integration gate.

Recently completed MVP mitigations:

- Removed hardcoded Azure Service Bus credentials from the demo app.
- Made the demo app run locally with SQLite, in-memory transport, and dashboard.
- Implemented dashboard `POST /scheduler/flush-outbox`.
- Added efficient MikroORM dashboard list/find methods.
- Removed tracked generated artifacts such as nested `node_modules` and
  `tsbuildinfo`.
- Aligned first-party peer dependency ranges for current package versions.
- Added first-class header propagation across core, scheduler, dashboard, local
  bus, Azure Service Bus, and NestJS microservices transport.

## v1

v1 is the first stable public API release:

- Stable exported interfaces and module registration APIs.
- Version alignment across first-party packages.
- Production setup guide.
- Broader adapter integration tests.
- Broker-specific hardening for the NestJS microservices transport adapter.
- Dashboard UI polish and richer operator feedback.
- SQL Server-specific claim support remains future adapter work.
- Migration guide for 0.7 databases and APIs.
- Release checklist and changelog discipline.
- Clear compatibility promises for adapters and dashboard APIs.

## Later

Later work expands the ecosystem:

- Additional storage adapters.
- Additional transport adapters.
- Observability with metrics and tracing.
- Dashboard read-only/operator roles.
- Richer message metadata and correlation support.
- Payload schema/versioning guidance.
