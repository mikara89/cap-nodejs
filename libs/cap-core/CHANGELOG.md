# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.4.0 (2026-07-26)

### Features

- recover stale pending inbox rows through the optional
  `inboxFallbackWindowMs` scheduler setting while retaining failed-row recovery
- add optional framework-neutral messaging administration ports, guarded inbox
  and outbox requeue APIs, aggregate snapshots, and capability type guards
- add optional typed diagnostics for durable inbox and outbox transitions

### Compatibility

- preserve at-least-once delivery and idempotent inbox semantics
- keep administration and diagnostics optional for third-party storage and
  transport implementations
- keep existing publisher, subscriber, and base storage-port contracts
  compatible; no transactional inbox processing is introduced

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
