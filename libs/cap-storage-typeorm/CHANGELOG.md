# Changelog

## 2.3.0

- Release the framework-free TypeORM outbox and inbox adapter as a current
  first-party storage option.
- Support PostgreSQL, MySQL/MariaDB, and SQLite schema initialization, explicit
  TypeORM `EntityManager` contexts, and operation-context publishing.
- Pass the shared publish- and received-storage contract suites; report SQLite
  conservatively as unsuitable for safe multi-instance claiming.
- Keep shared SQL-core extraction deferred.

## 2.2.0

- Add the first TypeORM storage adapter package for CAP outbox and inbox
  persistence.
