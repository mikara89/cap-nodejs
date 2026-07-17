# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.2](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-storage-prisma@2.2.1...@mikara89/cap-storage-prisma@2.2.2) (2026-07-17)

### Bug Fixes

- **core:** fence outbox claim ownership ([2a381ad](https://github.com/mikara89/cap-nodejs/commit/2a381adcd8c158779e6260a058851ce378bc6209))
- **storage:** preserve retry thresholds on MySQL ([4a3579e](https://github.com/mikara89/cap-nodejs/commit/4a3579e60be55baa4a761a67126f6b52af3deff1))
- **types:** eliminate core and Prisma unsafe-value warnings ([#8](https://github.com/mikara89/cap-nodejs/issues/8)) ([0135a58](https://github.com/mikara89/cap-nodejs/commit/0135a58d95c895347ccf227278c0d9114b4fe9af))

## [2.2.1](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-storage-prisma@2.2.0...@mikara89/cap-storage-prisma@2.2.1) (2026-07-11)

### Bug Fixes

- **release:** prevent release-tooling subprocess hang ([0f5790f](https://github.com/mikara89/cap-nodejs/commit/0f5790f243ea35c37a95e02e86b5bfaa6400df45))
- **release:** restore Lerna release authority ([044f165](https://github.com/mikara89/cap-nodejs/commit/044f1658247a8ba6efb4870ca1c76610138a948e))

### Reverts

- Revert "chore(release): prepare 2.3.0" ([de35e0e](https://github.com/mikara89/cap-nodejs/commit/de35e0ef6bec2f4aa6b94092298908be91186c11))

# Changelog

## 2.2.0 (2026-06-27)

- Release the framework-free Prisma outbox and inbox adapter as a current
  first-party storage option.
- Use parameterized raw SQL with `Prisma.TransactionClient`, so applications do
  not need CAP models in their Prisma schema.
- Support PostgreSQL, MySQL/MariaDB, and SQLite schema initialization and pass
  the shared publish- and received-storage contract suites.
- Cover PostgreSQL and MySQL claim behavior with DB integration tests; keep
  SQLite as a local and single-process option.
- Keep shared SQL-core extraction deferred.
