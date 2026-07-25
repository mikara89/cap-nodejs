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
4. [Messaging diagnostics](diagnostics.md) - optional typed operational events,
   privacy boundary, and best-effort delivery semantics.
5. [Adapters](adapters.md) - storage and transport contracts, current adapters,
   and planned storage/transport adapter matrices.
6. [Transport adapter author guide](transport-adapter-author-guide.md) - the
   verified common transport contract, conformance harness, and settlement
   boundary.
7. [Dashboard](cap-dashboard.md) - admin API and UI behavior.
8. [API reference](api/README.md) - generated package API documentation.
9. [Package export surface](package-exports.md) - supported import paths and
   current package `exports` maps.
10. [Future libs layout](architecture/libs-layout.md) - proposed package folder
    grouping without moving folders in v2.1.1.
11. [GitHub Pages homepage](github-pages.md) - public homepage setup.
12. [Roadmap](roadmap.md) - current package set and the v2.2, v2.3, v2.4, and
    v2.5+ ecosystem plan.
13. [Release checklist](release.md) - validation and publishing safety.
14. [Legacy npm package names](legacy-packages.md) - mappings from deprecated
    npm identities to current packages.
15. [Schema/API migration](migrations/0.7-to-1.0.md) - upgrade notes for
    stable schema and API behavior.
16. [Framework-agnostic core migration](migration/framework-agnostic-core.md) -
    package rename and adapter split notes.
17. [v2.2 transaction context migration](migration/v2.2-transaction-context.md) -
    operation-context foundation notes.
18. [ADRs](adr/README.md) - durable architecture decisions.
19. [Contributing](contributing.md) - local workflow, repo health checks, tests,
    coverage, and docs rules.

## Current Maturity

The repository roadmap is on the v2.4 line. The core publish/subscribe path,
first-party adapters, dashboard package, header propagation, release workflow,
and PostgreSQL/MySQL multi-instance claim gate are in place. v2.2 added the
transaction-context foundation; v2.3 adds received-storage contracts and
current Knex, TypeORM, and Prisma storage adapters alongside MikroORM. v2.4 adds the transport contract foundation alongside
first-party RabbitMQ, Kafka, and AWS SNS/SQS transport adapters. NATS and
Google Pub/Sub remain future candidates. The [roadmap](roadmap.md) tracks later phases and
v2.5+ ecosystem candidates.

v2.4.1 also documents optional NestJS modules for the Knex, TypeORM, and Prisma
storage adapters. Their framework-neutral roots and explicit `/nest` import
boundaries are described in the [package export surface](package-exports.md).

## Documentation Rules

- Keep root `README.md` as the public entry point.
- Keep package READMEs short and link back here for deeper guidance.
- Regenerate `docs/api/` with `npm run docs:api` when public exports change.
- Keep examples compile-checked with `npm run examples:check`.
- Add or update an ADR when a durable architecture decision changes.
- Update the roadmap when work moves between current, planned, candidate, or
  future package status.
