# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
