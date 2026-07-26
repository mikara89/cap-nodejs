# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.0](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-testing@2.2.0...@mikara89/cap-testing@2.3.0) (2026-07-25)


### Features

* **core:** add a versioned CAP message envelope ([de2a854](https://github.com/mikara89/cap-nodejs/commit/de2a8545ead5cf7fdf2f5eb9230c7a23c1a3fc7b))
* **core:** add messaging administration APIs ([#15](https://github.com/mikara89/cap-nodejs/issues/15)) ([2dc1ae9](https://github.com/mikara89/cap-nodejs/commit/2dc1ae983187d4e599ead38ee0bc814036d59ae0))
* **envelope:** preserve package and bridge compatibility ([b4bdb97](https://github.com/mikara89/cap-nodejs/commit/b4bdb9738b4471273d3081813f840df3d9385dda))
* **inbox:** recover stale pending messages during scheduled retries ([912557a](https://github.com/mikara89/cap-nodejs/commit/912557a94af07c8da4aad81aaecd41bf91815738))


### Bug Fixes

* **core:** fence outbox claim ownership ([2a381ad](https://github.com/mikara89/cap-nodejs/commit/2a381adcd8c158779e6260a058851ce378bc6209))
* **release:** restore Lerna release authority ([044f165](https://github.com/mikara89/cap-nodejs/commit/044f1658247a8ba6efb4870ca1c76610138a948e))
* **storage:** preserve retry thresholds on MySQL ([4a3579e](https://github.com/mikara89/cap-nodejs/commit/4a3579e60be55baa4a761a67126f6b52af3deff1))
* **storage:** update order by logic for received storage to prioritize failed status ([e42aa67](https://github.com/mikara89/cap-nodejs/commit/e42aa6705b4bd4864ad6ce1db3c4b92b221775bd))


### Reverts

* Revert "chore(release): prepare 2.3.0" ([de35e0e](https://github.com/mikara89/cap-nodejs/commit/de35e0ef6bec2f4aa6b94092298908be91186c11))




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
