# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.4.0](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-core@2.3.1...@mikara89/cap-core@2.4.0) (2026-07-25)

### Features

- **core:** add messaging administration APIs ([#15](https://github.com/mikara89/cap-nodejs/issues/15)) ([2dc1ae9](https://github.com/mikara89/cap-nodejs/commit/2dc1ae983187d4e599ead38ee0bc814036d59ae0))
- **inbox:** recover stale pending messages during scheduled retries ([912557a](https://github.com/mikara89/cap-nodejs/commit/912557a94af07c8da4aad81aaecd41bf91815738))

* add optional typed messaging diagnostics for durable inbox and outbox transitions
* add framework-neutral administration ports, guarded requeue APIs, and aggregate messaging snapshots
* add the optional `scheduler.inboxFallbackWindowMs` recovery window

### Bug Fixes

- **storage:** update order by logic for received storage to prioritize failed status ([e42aa67](https://github.com/mikara89/cap-nodejs/commit/e42aa6705b4bd4864ad6ce1db3c4b92b221775bd))

## Unreleased

## [2.3.1](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-core@2.3.0...@mikara89/cap-core@2.3.1) (2026-07-17)

### Bug Fixes

- **types:** eliminate core and Prisma unsafe-value warnings ([#8](https://github.com/mikara89/cap-nodejs/issues/8)) ([0135a58](https://github.com/mikara89/cap-nodejs/commit/0135a58d95c895347ccf227278c0d9114b4fe9af))

## 2.3.0 (2026-07-12)

### Features

- add ownership-fenced outbox claiming and active lease renewal
- add awaited subscriber startup and shutdown lifecycle
- add versioned CAP message envelopes
- preserve ordinary business payloads containing a `payload` property

### Compatibility

- retain at-least-once delivery semantics
- retain native broker payload formats where native headers are supported
- add temporary strict legacy-envelope compatibility

## 2.2.0 (2026-06-26)

### Features

- add `CapOperationContext`, `ctx` publish support, and optional
  `CapTransactionContext` ambient transaction context
- add `CapTransactionManagerPort`, `CapTransactionOptions`, and
  `CapTransactionPropagation` as a framework-free transaction manager extension
  point
- add `CapStorageCapabilities` and `CapabilityAwareStoragePort` for
  informational storage capability reporting

### Compatibility

- keep existing `publish(..., { tx })` calls working with no expected breaking
  changes for transaction-handle users
- prefer `savePublish(event, ctx?)`; keep `savePublishWithTx(event, tx)` only as
  deprecated compatibility for legacy storage adapters

# 0.7.0-beta.4 (2026-06-24)

**Note:** Version bump only for package @mikara89/cap-core

# Changelog

## 0.7.0-beta.3

Initial package scaffold for `@mikara89/cap-core`.
