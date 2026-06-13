# CAP Documentation

This folder is the developer documentation for CAP, a NestJS reliable messaging
library built around outbox/inbox persistence, retry scheduling, and pluggable
adapters.

## Reading Path

1. [Getting started](getting-started.md) - smallest working setup and production
   registration shape.
2. [Architecture](architecture.md) - core flow, modules, transactions, and
   diagrams.
3. [Adapters](adapters.md) - storage and transport contracts plus the current
   MikroORM and Azure Service Bus adapters.
4. [Dashboard](cap-dashboard.md) - admin API and UI behavior.
5. [Roadmap](roadmap.md) - MVP, Beta, v1, and Later stages.
6. [Release checklist](release.md) - validation and publishing safety.
7. [ADRs](adr/README.md) - durable architecture decisions.
8. [Contributing](contributing.md) - local workflow, tests, coverage, and docs
   rules.

## Current Maturity

The repository is pre-MVP. The core publish/subscribe path exists, first-party
MikroORM and Azure Service Bus adapters exist, and the dashboard package exists.
The [roadmap](roadmap.md) tracks remaining hardening work before the project can
be considered MVP-ready.

## Documentation Rules

- Keep root `README.md` as the public entry point.
- Keep package READMEs short and link back here for deeper guidance.
- Add or update an ADR when a durable architecture decision changes.
- Update the roadmap when work moves between MVP, Beta, v1, or Later.
