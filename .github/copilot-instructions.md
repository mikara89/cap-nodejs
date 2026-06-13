# CAP NestJS Library - Copilot Instructions

## Project Overview

CAP is a NestJS reliable messaging library. The core package orchestrates
outbox/inbox persistence, transport emission, handler discovery, and retry
scheduling. First-party packages provide MikroORM storage, Azure Service Bus
transport, and an optional dashboard.

## Monorepo Structure

```text
libs/
  cap-nest/                    # Core library and public API
  storage-mikro-orm/           # MikroORM storage adapter
  transport-azure-servicebus/  # Azure Service Bus transport adapter
  cap-dashboard/               # Optional dashboard REST API and UI
apps/
  cap-test-app/                # Local smoke app and e2e test host
docs/
  adr/                         # Architecture Decision Records
```

## Core Architecture

- `CapService` saves produced messages to outbox storage before transport emit.
- `@CapSubscribe` marks provider methods as message handlers.
- `CapSubscriberScanner` discovers decorated handlers during Nest module init.
- `RetrySchedulerService` retries unpublished outbox rows every 30 seconds and
  due inbox rows every minute.
- Storage and transport are injected through Symbol tokens:
  `PUBLISH_STORAGE`, `RECEIVED_STORAGE`, `PUBLISHER`, `SUBSCRIBER`.

## Message Flow

1. `CapService.publish(topic, payload, headers?)`
2. `IPublishStorage.savePublish(event)`
3. `IPublisher.emit(topic, payload)`
4. `IPublishStorage.markPublished(id)` on success
5. `ISubscriber.consume(topic, group, callback)` receives broker messages
6. `IReceivedStorage.saveReceived(event)` persists inbox state
7. handler runs and marks processed or schedules retry

## Adapter Rules

- Storage adapters implement `IPublishStorage` and `IReceivedStorage`.
- Transport adapters implement `IPublisher` and `ISubscriber`.
- Production storage adapters should provide dashboard helpers:
  `findPublishById`, `findReceivedById`, `listPublish`, `listReceived`.
- Optional initialization is exposed through `initialize(options?: InitOptions)`.
- Transaction-aware storage may implement `savePublishWithTx`.
- Transaction-aware transport may implement `emitWithTx`.

## Test App Profiles

`apps/cap-test-app` must run safely without Azure credentials:

- Default local profile: SQLite, in-memory CAP transport, dashboard enabled.
- Service Bus profile: enabled only when `SERVICEBUS_CONNECTION_STRING` or
  `AZURE_SERVICEBUS_CONNECTION_STRING` is set.
- Do not commit Service Bus connection strings or registry credentials.

Demo endpoints:

- `GET /demo/health`
- `POST /demo/publish?msg=hello`
- `POST /demo/publish-transactional?msg=hello`
- `POST /demo/fail-next-handler`
- dashboard API at `/api/cap`
- dashboard UI at `/cap-dashboard`

## Development Commands

```powershell
npm install
npm run build
npm test
npm run test:e2e
npm run test:integration
npm run lint        # auto-fix local code
npm run lint:check  # CI-safe lint
npm run pack:dry-run
```

Build libs before running the compiled app because root TypeScript paths point
package imports at `dist`.

## CI and Release Policy

- `ci.yml` validates only. It must not publish.
- `release.yml` is the only publishing workflow.
- Release is manual or tag-triggered with tags matching `v*`.
- Release uses Node 22, `npm ci`, library build, package dry-run, and Lerna
  publish.
- Package contents must be checked before publish, especially dashboard
  `dist/public` assets.

## Documentation

- Root `README.md` is the public entry point.
- `docs/architecture.md` explains runtime flow.
- `docs/adapters.md` explains adapter contracts.
- `docs/cap-dashboard.md` explains dashboard API and security.
- `docs/release.md` contains the release checklist.
- Add or update an ADR for durable architecture decisions.
