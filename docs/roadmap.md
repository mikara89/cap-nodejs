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
- Dashboard REST API and static UI for inspection and admin actions.
- Clean documentation and ADRs.
- Passing test suite for core behavior and first-party package behavior.

Remaining MVP gaps:

- Decide whether `CapHeaders` decorator support is MVP or post-MVP.
- Harden external Azure Service Bus integration coverage.
- Finish release/version policy for the first public MVP package set.
- Keep dashboard e2e coverage aligned with the real demo flow.

Recently completed MVP mitigations:

- Removed hardcoded Azure Service Bus credentials from the demo app.
- Made the demo app run locally with SQLite, in-memory transport, and dashboard.
- Implemented dashboard `POST /scheduler/flush-outbox`.
- Added efficient MikroORM dashboard list/find methods.
- Removed tracked generated artifacts such as nested `node_modules` and
  `tsbuildinfo`.
- Aligned first-party peer dependency ranges for current package versions.

## Beta

Beta focuses on hardening behavior after MVP:

- Broader adapter integration tests.
- Dashboard UI polish and clearer operator feedback.
- Stronger Azure Service Bus failure and lifecycle coverage.
- Production-oriented examples using environment variables only.
- Clear migration guidance for MikroORM schemas.

## v1

v1 is the first stable public API release:

- Stable exported interfaces and module registration APIs.
- Version alignment across first-party packages.
- Production setup guide.
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
