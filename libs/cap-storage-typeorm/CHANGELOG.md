# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.1](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-storage-typeorm@2.2.0...@mikara89/cap-storage-typeorm@2.2.1) (2026-07-11)

### Bug Fixes

- **release:** prevent release-tooling subprocess hang ([0f5790f](https://github.com/mikara89/cap-nodejs/commit/0f5790f243ea35c37a95e02e86b5bfaa6400df45))
- **release:** restore Lerna release authority ([044f165](https://github.com/mikara89/cap-nodejs/commit/044f1658247a8ba6efb4870ca1c76610138a948e))

### Reverts

- Revert "chore(release): prepare 2.3.0" ([de35e0e](https://github.com/mikara89/cap-nodejs/commit/de35e0ef6bec2f4aa6b94092298908be91186c11))

# Changelog

## 2.2.0 (2026-06-27)

- Release the framework-free TypeORM outbox and inbox adapter as a current
  first-party storage option.
- Support PostgreSQL, MySQL/MariaDB, and SQLite schema initialization, explicit
  TypeORM `EntityManager` contexts, and operation-context publishing.
- Pass the shared publish- and received-storage contract suites; report SQLite
  conservatively as unsuitable for safe multi-instance claiming.
- Keep shared SQL-core extraction deferred.
