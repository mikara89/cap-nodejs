# CAP Node.js Documentation

This folder is the developer documentation for CAP Node.js, a reliable
messaging package set built around outbox/inbox persistence, retry scheduling,
framework adapters, and pluggable storage and transport adapters.

## Reading Path

1. [Getting started](getting-started.md) - smallest working setup and production
   registration shape.
2. [Architecture](architecture.md) - core flow, modules, transactions, and
   diagrams.
3. [Transactions](transactions.md) - publish transaction handles, operation
   contexts, and immediate emit behavior.
4. [Adapters](adapters.md) - storage and transport contracts, current adapters,
   and planned storage/transport adapter matrices.
5. [Transport adapter author guide](transport-adapter-author-guide.md) - the
   verified common transport contract, conformance harness, and settlement
   boundary.
6. [Dashboard](cap-dashboard.md) - admin API and UI behavior.
7. [API reference](api/README.md) - generated package API documentation.
8. [Package export surface](package-exports.md) - supported import paths and
   current package `exports` maps.
9. [Future libs layout](architecture/libs-layout.md) - proposed package folder
   grouping without moving folders in v2.1.1.
10. [GitHub Pages homepage](github-pages.md) - public homepage setup.
11. [Roadmap](roadmap.md) - current package set and the v2.2, v2.3, v2.4, and
    v2.5+ ecosystem plan.
12. [Release checklist](release.md) - validation and publishing safety.
13. [Schema/API migration](migrations/0.7-to-1.0.md) - upgrade notes for
    stable schema and API behavior.
14. [Framework-agnostic core migration](migration/framework-agnostic-core.md) -
    package rename and adapter split notes.
15. [v2.2 transaction context migration](migration/v2.2-transaction-context.md) -
    operation-context foundation notes.
16. [ADRs](adr/README.md) - durable architecture decisions.
17. [Contributing](contributing.md) - local workflow, repo health checks, tests,
    coverage, and docs rules.

## Current Maturity

The repository roadmap is on the v2.4 line. The core publish/subscribe path,
first-party adapters, dashboard package, header propagation, release workflow,
and PostgreSQL/MySQL multi-instance claim gate are in place. v2.2 added the
transaction-context foundation; v2.3 adds received-storage contracts and
current Knex, TypeORM, and Prisma storage adapters alongside MikroORM. v2.4 adds the transport contract foundation alongside
first-party RabbitMQ and Kafka transport adapters. AWS SNS/SQS remains planned
and unavailable. The [roadmap](roadmap.md) tracks later phases and
v2.5+ ecosystem candidates.

## Documentation Rules

- Keep root `README.md` as the public entry point.
- Keep package READMEs short and link back here for deeper guidance.
- Regenerate `docs/api/` with `npm run docs:api` when public exports change.
- Keep examples compile-checked with `npm run examples:check`.
- Add or update an ADR when a durable architecture decision changes.
- Update the roadmap when work moves between current, planned, candidate, or
  future package status.
