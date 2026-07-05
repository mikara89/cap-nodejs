# Development Validation Tiers

CAP uses three validation tiers to balance speed and thoroughness. The
workspace root is private (`cap-nodejs`); only `libs/*` packages are
publishable. Lerna 9 in independent mode is the sole version authority.

## Tier 1 — Fast local loop

Run these after every change before pushing a branch:

```powershell
npm run lint:affected          # Lint changed packages
npm run build:affected         # Build changed packages + dependents
npm run test:affected          # Test changed packages
```

For focused adapter or storage work, run the package-specific scripts:

```powershell
# Transport adapters
npm run test:lib:cap-transport-rabbitmq
npm run test:lib:cap-transport-kafka
npm run test:lib:cap-transport-aws-sns-sqs
npm run test:lib:cap-transport-nestjs-microservices
npm run test:lib:cap-transport-azure-servicebus

# Transport integration (requires Docker or cloud credentials, manual/on-request)
npm run test:integration:rabbitmq
npm run test:integration:kafka
npm run test:integration:aws-sns-sqs
npm run test:integration:servicebus

# Storage adapters
npm run test:lib:cap-storage-mikro-orm
npm run test:lib:cap-storage-knex
npm run test:lib:cap-storage-typeorm
npm run test:lib:cap-storage-prisma

# Core / engine / dashboard
npm run test:lib:cap-core
npm run test:lib:cap-testing
npm run test:lib:cap-nest
npm run test:lib:cap-express
npm run test:lib:cap-dashboard-core
npm run test:lib:cap-dashboard-nest
npm run test:lib:cap-dashboard-express
npm run test:lib:cap-dashboard
```

List what changed without running anything:

```powershell
npm run check:affected
```

### What caching covers

`nx.json` defines task pipelines and cacheable operations for `build`, `lint`,
and `test`. Nx skips tasks whose inputs (source files, config, dependencies)
have not changed since the last run. This makes repeated `build:affected` and
`test:affected` nearly instant when only a single package is touched.

Key pipeline rules:

- `build` depends on dependent packages' builds (`^build`), outputs `dist/`
- `test` depends on `build`
- `lint` is independent of build

Cache is local by default (`node_modules/.cache/nx`). It is not committed.

### Build order

For a full sequential build (release parity), use:

```powershell
npm run build:libs              # Root sequential build
npm run build:libs:lerna        # Lerna parallel build
```

## Tier 2 — PR acceptance

Run these before opening a pull request or when CI flags an issue:

```powershell
# Affected validation (Tier 1)
npm run lint:affected
npm run build:affected
npm run test:affected

# Full lint (root-level eslint)
npm run lint:check

# Type-check examples
npm run examples:check

# API docs (if public API surface changed)
npm run docs:api

# Package integrity (for changed publishable packages)
npm run pack:dry-run:affected

# Release tooling (if release files or lerna config changed)
npm run test:release-tooling
npm run release:verify
```

### When to run what

| Change | Required checks |
|---|---|
| New adapter package | `lint:check`, `build`, `test`, `examples:check`, `pack:dry-run`, `test:release-tooling`, `release:verify` |
| Adapter code only | `lint:affected`, `build:affected`, `test:affected`, `examples:check` |
| Core engine change | `lint:check`, `build`, `test`, `test:e2e`, `examples:check`, `docs:api` |
| Storage adapter change | `lint:affected`, `build:affected`, `test:affected`, `test:integration:db` (if schema/query changed) |
| Dashboard change | `lint:affected`, `build:affected`, `test:affected` |
| Root docs/config only | `lint:check`, `release:verify`, `test:release-tooling` |

### Transport integration gates

Transport integration tests require external broker connectivity. These run
only when the relevant transport package changed or when manually triggered:

- **RabbitMQ**: `npm run test:integration:rabbitmq` — requires `RABBITMQ_URL`
  or local RabbitMQ on `amqp://localhost:5672`
- **Kafka**: `npm run test:integration:kafka` — requires `KAFKA_BROKERS` or
  local Kafka on `localhost:9092`
- **AWS SNS/SQS**: `npm run test:integration:aws-sns-sqs` — requires Docker
  (LocalStack container)
- **Azure Service Bus**: `npm run test:integration:servicebus` — requires
  `SERVICEBUS_CONNECTION_STRING`

Transport integration tests are resource-heavy. They are manual/on-request in
CI and release workflows. Use the workflow dispatch inputs to enable them:
`run_rabbitmq_integration`, `run_kafka_integration`,
`run_aws_sns_sqs_integration`, and `run_servicebus_integration`. Before a final
GA release, maintainers should run all transport integration gates manually.

Pack smoke tests verify that the published tarball is installable and complete.
These are always required in CI and release workflows:

- `npm run pack:smoke:rabbitmq`
- `npm run pack:smoke:kafka`
- `npm run pack:smoke:aws-sns-sqs`

## Tier 3 — Release gate

The `.github/workflows/release.yml` workflow is manual (`workflow_dispatch`).
It runs the complete validation suite before publishing.

**Always-on gates** (run on every release):

1. Full audit (`npm audit --omit=dev`)
2. Full lint (`npm run lint:check`)
3. Full build (`npm run build`)
4. Full test (`npm test -- --runInBand`)
5. E2E tests (`npm run test:e2e`)
6. DB integration (`npm run test:integration:db`)
7. Examples check (`npm run examples:check`)
8. API docs (`npm run docs:api`)
9. Package integrity (`npm run pack:dry-run`)
10. Pack smoke: RabbitMQ (`npm run pack:smoke:rabbitmq`)
11. Pack smoke: Kafka (`npm run pack:smoke:kafka`)
12. Pack smoke: AWS SNS/SQS (`npm run pack:smoke:aws-sns-sqs`)
13. Release plan generated by `release:plan`

**Manual/on-request gates** (set workflow input to `true`):

- RabbitMQ integration (`run_rabbitmq_integration`)
- Kafka integration (`run_kafka_integration`)
- AWS SNS/SQS integration (`run_aws_sns_sqs_integration`)
- Azure Service Bus integration (`run_servicebus_integration`)

The release gate is the final authority. Nothing is published unless all steps
pass.

## CI pipeline

### PR and push to main (`.github/workflows/ci.yml`)

Runs the complete validation suite on every PR and push to main. This is the
safety net that catches regressions.

### Release (`.github/workflows/release.yml`)

Manual trigger only. Validates, calculates the Lerna release plan, and
publishes to npm after the protected `npm-production` environment is approved.

## Quick reference

```powershell
# What changed?
npm run check:affected

# Fast dev loop
npm run lint:affected
npm run build:affected
npm run test:affected

# Specific package
npm run test:lib:cap-transport-rabbitmq
npm run test:integration:rabbitmq
npm run pack:smoke:rabbitmq

# Full validation (release parity)
npm run lint:check
npm run build
npm test
npm run test:e2e
npm run examples:check
npm run docs:api
npm run pack:dry-run
npm run test:release-tooling
npm run release:verify
```
