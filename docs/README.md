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
8. [Roadmap](roadmap.md) - MVP, Beta, v1, and Later stages.
9. [Release checklist](release.md) - validation and publishing safety.
10. [ADRs](adr/README.md) - durable architecture decisions.
11. [Contributing](contributing.md) - local workflow, repo health checks, tests,
    coverage, and docs rules.

## Current Maturity

The repository is on the MVP beta track. The core publish/subscribe path,
first-party adapters, dashboard package, header propagation, and beta release
workflow are in place. The [roadmap](roadmap.md) tracks remaining maturity work
for Beta, v1, and Later stages.

## Documentation Rules

- Keep root `README.md` as the public entry point.
- Keep package READMEs short and link back here for deeper guidance.
- Regenerate `docs/api/` with `npm run docs:api` when public exports change.
- Keep examples compile-checked with `npm run examples:check`.
- Add or update an ADR when a durable architecture decision changes.
- Update the roadmap when work moves between MVP, Beta, v1, or Later.
