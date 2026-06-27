# Storage Adapter Author Guide

This guide describes the minimum contract for CAP storage adapters. Storage
packages should keep their package root framework-free and expose framework
wrappers only from explicit subpaths such as `/nest`.

Use `@mikara89/cap-storage-knex`, `@mikara89/cap-storage-typeorm`, and
`@mikara89/cap-storage-prisma` as v2.3 reference adapters for framework-free
SQL storage packages. Prisma demonstrates how a generated-client ORM can use a
small structural raw-SQL interface without requiring CAP schema models. Do not
extract a shared SQL core until multiple real adapters prove repeated
implementation details.

## Package Shape

- Use the `@mikara89/cap-*` package naming rule for publishable packages.
- Keep the package root free of NestJS, Express, or framework-only imports.
- Put framework registration modules under explicit subpaths, for example
  `@mikara89/cap-storage-example/nest`.
- Do not leak database-driver details through CAP core or cap-testing APIs.
- Verify package exports with `npm run pack:dry-run` before publishing.

## Publish Storage

Implement `PublishStoragePort.savePublish(event, ctx?)` as the primary outbox
write API. Adapters that support transactions should read the ORM-specific
transaction from `ctx.tx`.

`savePublishWithTx(event, tx)` is deprecated compatibility only. Existing
adapters may keep it as a wrapper over `savePublish(event, { tx })`, but new
code should call `savePublish(event, ctx?)`.

Publish storage must also implement:

- `claimUnpublished({ limit, lockedBy, lockUntil, now })`
- `markPublished(id, publishedAt?)`
- `markPublishFailed(id, error, { maxRetries, nextRetryAt, now })`
- `releaseExpiredClaims(now)`
- optional `initialize(options)`
- optional dashboard helpers: `findPublishById`, `listPublish`

Use `definePublishStorageContract` from `@mikara89/cap-testing` in the adapter
test suite. Pass conservative capability options until the adapter has tests
that prove stronger behavior.

## Received Storage

Implement `ReceivedStoragePort` for inbox persistence:

- `trySaveReceived(event)` returning `{ inserted, id, event }`
- `markProcessed(id, processedAt?)`
- `markReceivedFailed(id, error, { maxRetries, nextRetryAt, now })`
- `getRetryDue(limit, now?)`
- optional `initialize(options)`
- optional dashboard helpers: `findReceivedById`, `listReceived`

Inbox dedupe must use consumer `group` plus `dedupeKey`. The broker
`messageId` is traceability metadata unless a transport also uses it to build
the dedupe key.

Use `defineReceivedStorageContract` from `@mikara89/cap-testing` in the adapter
test suite. Keep unsupported concurrency guarantees explicit through the
contract options.

## Capabilities

Implement `CapabilityAwareStoragePort` when the adapter can report behavior
without guessing. Report conservative capabilities:

- `transactions`
- `skipLockedClaiming`
- `advisoryLocks`
- `atomicInsertIgnore`
- `nestedTransactions`
- `isolationLevels`

Capability values are informational in the current release line. They should
match documented behavior and the contract options used in tests.

## Release Checks

Before a storage adapter is treated as first-party, verify:

- publish storage passes `definePublishStorageContract`
- received storage passes `defineReceivedStorageContract`
- transaction and rollback behavior are documented
- package root has no framework imports
- package exports expose only intended public APIs
- examples compile
- pack dry-run contains the expected files
