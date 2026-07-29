# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## Unreleased

- add reusable inbox and outbox administration storage contracts

- extend the received-storage contract with stale pending inbox recovery
  eligibility, combined limits, deterministic reads, and legacy-call coverage

## 2.2.0 (2026-06-27)

### Features

- add `definePublishStorageContract()` for shared publish-storage conformance
  tests covering transaction context behavior and rollback-capable adapters
- add `defineReceivedStorageContract()` for reusable inbox persistence,
  deduplication, retry, dead-letter, and capability-aware concurrency checks
- use both contract suites to qualify the Knex, TypeORM, Prisma, and MikroORM
  adapters in the published storage matrix

# 0.7.0-beta.4 (2026-06-24)

**Note:** Version bump only for package @mikara89/cap-testing

# Changelog

## 0.7.0-beta.3

Initial package scaffold for `@mikara89/cap-testing`.
