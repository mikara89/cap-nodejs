# CAP Framework-Agnostic Library - Copilot Instructions

## Project Overview

CAP is a framework-agnostic reliable messaging platform with thin framework
adapters. `@mikara89/cap-core` owns outbox/inbox orchestration, transport
emission, handler execution, retry scheduling, and shared contracts. First-party
packages provide NestJS and Express adapters, MikroORM storage, Azure Service
Bus transport, NestJS microservices transport, dashboard bindings, and testing
helpers.

## Monorepo Structure

```text
libs/
  cap-core/                    # Framework-free engine, scheduler, models, ports
  cap-nest/                    # NestJS adapter and compatibility API
  cap-express/                 # Express adapter and health router
  cap-storage-mikro-orm/       # MikroORM storage adapter and Nest wrapper
  cap-transport-azure-servicebus/ # Azure Service Bus transport and Nest wrapper
  cap-transport-nestjs-microservices/ # NestJS ClientProxy transport adapter
  cap-dashboard-core/          # Framework-free dashboard service and DTOs
  cap-dashboard-nest/          # NestJS dashboard module/controller/UI
  cap-dashboard-express/       # Express dashboard router
  cap-dashboard/               # Compatibility alias for cap-dashboard-nest
  cap-testing/                 # In-memory/fake test helpers
apps/
  cap-test-app/                # Local smoke app and e2e test host
docs/
  adr/                         # Architecture Decision Records
```

## Core Architecture

- `CapEngine` saves produced messages to outbox storage before transport emit.
- `CapScheduler` performs framework-free outbox and inbox retry loops.
- `CapService` in `cap-nest` is a thin wrapper over `CapEngine`.
- `createCapExpress` in `cap-express` creates an Express-friendly wrapper over
  `CapEngine`.
- `@CapSubscribe` marks provider methods as message handlers.
- `CapSubscriberScanner` discovers decorated handlers during Nest module init.
- `NestCapSchedulerService` is lifecycle glue around the core scheduler.
- Core storage and transport ports use Symbol tokens:
  `PUBLISH_STORAGE`, `RECEIVED_STORAGE`, `PUBLISHER`, `SUBSCRIBER`.
- Nest adapter tokens include `CAP_ENGINE`, `CAP_MODULE_OPTIONS`, and
  `CAP_SCHEDULER`.

## Message Flow

1. `CapEngine.publish(topic, payload, options?)`
2. `PublishStoragePort.savePublish(event)`
3. `PublisherPort.emit(topic, payload, headers?, metadata?)`
4. `PublishStoragePort.markPublished(id)` on success
5. `SubscriberPort.consume(topic, group, callback)` receives broker messages
6. `ReceivedStoragePort.trySaveReceived(event)` persists inbox state
7. handler runs and marks processed or schedules retry

## Adapter Rules

- Framework-free storage adapters implement `PublishStoragePort` and
  `ReceivedStoragePort` from `@mikara89/cap-core`.
- Transport adapters implement `PublisherPort` and `SubscriberPort` from
  `@mikara89/cap-core`.
- Storage and transport implementation classes must not import
  `@mikara89/cap-nest`; Nest wrappers live under each package's `src/nest/`
  folder when needed.
- Production storage adapters should provide dashboard helpers:
  `findPublishById`, `findReceivedById`, `listPublish`, `listReceived`.
- Optional initialization is exposed through `initialize(options?: InitOptions)`.
- Transaction-aware storage may implement `savePublishWithTx`.
- Transport adapters preserve primitive CAP headers where the broker supports
  metadata.

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
npm run test:integration:db
npm run test:integration:servicebus
npm run lint        # auto-fix local code
npm run lint:check  # CI-safe lint
npm run examples:check
npm run docs:api
npm run pack:dry-run
npm ls --workspaces --depth=0
```

Build libs before running the compiled app because root TypeScript paths point
package imports at `dist`.

## CI and Release Policy

- `ci.yml` validates only. It must not publish.
- `release.yml` is the only publishing workflow.
- Release is manual or tag-triggered with tags matching `v*`.
- Release uses Node 22, `npm ci`, explicit `npm run build:libs`, package
  dry-run, and Lerna publish.
- Package contents must be checked before publish, especially dashboard
  `dist/public` assets.

## Documentation

- Root `README.md` is the public entry point.
- `docs/architecture.md` explains runtime flow.
- `docs/adapters.md` explains adapter contracts.
- `docs/cap-dashboard.md` explains dashboard API and security.
- `docs/release.md` contains the release checklist.
- Add or update an ADR for durable architecture decisions.
