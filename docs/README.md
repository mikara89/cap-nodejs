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
   MikroORM, Azure Service Bus, and NestJS microservices adapters.
4. [Dashboard](cap-dashboard.md) - admin API and UI behavior.
5. [API reference](api/README.md) - generated package API documentation.
6. [Package export surface](package-exports.md) - supported import paths and
   future `exports` map plan.
7. [GitHub Pages homepage](github-pages.md) - public homepage setup.
8. [Roadmap](roadmap.md) - stable 0.7, v1, and later stages.
9. [Release checklist](release.md) - validation and publishing safety.
10. [Schema/API migration](migrations/0.7-to-1.0.md) - upgrade notes for
    stable schema and API behavior.
11. [Framework-agnostic core migration](migration/framework-agnostic-core.md) -
    package rename and adapter split notes.
12. [ADRs](adr/README.md) - durable architecture decisions.
13. [Contributing](contributing.md) - local workflow, repo health checks, tests,
    coverage, and docs rules.

## Current Maturity

The repository is on the stable 0.7 MVP line. The core publish/subscribe path,
first-party adapters, dashboard package, header propagation, release workflow,
and PostgreSQL/MySQL multi-instance claim gate are in place. The
[roadmap](roadmap.md) tracks remaining maturity work for v1 and later stages.

## Documentation Rules

- Keep root `README.md` as the public entry point.
- Keep package READMEs short and link back here for deeper guidance.
- Regenerate `docs/api/` with `npm run docs:api` when public exports change.
- Keep examples compile-checked with `npm run examples:check`.
- Add or update an ADR when a durable architecture decision changes.
- Update the roadmap when work moves between stable 0.7, v1, or later.
