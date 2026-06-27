# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.3.0 (2026-06-27)

### Features

- add `defineReceivedStorageContract()` for reusable inbox persistence,
  deduplication, retry, dead-letter, and capability-aware concurrency checks
- use the publish and received contract suites to qualify the Knex, TypeORM,
  and Prisma adapters for the v2.3 first-party storage matrix

## 2.2.0 (2026-06-26)

### Features

- add `definePublishStorageContract()` for shared publish-storage conformance
  tests covering transaction context behavior and rollback-capable adapters
- document capability-aware adapter testing expectations for v2.2 and planned
  v2.3 storage adapters

# 0.7.0-beta.4 (2026-06-24)

**Note:** Version bump only for package @mikara89/cap-testing

# Changelog

## 0.7.0-beta.3

Initial package scaffold for `@mikara89/cap-testing`.
