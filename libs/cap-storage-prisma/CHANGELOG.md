# Changelog

## 2.3.0

- Release the framework-free Prisma outbox and inbox adapter as a current
  first-party storage option.
- Use parameterized raw SQL with `Prisma.TransactionClient`, so applications do
  not need CAP models in their Prisma schema.
- Support PostgreSQL, MySQL/MariaDB, and SQLite schema initialization and pass
  the shared publish- and received-storage contract suites.
- Cover PostgreSQL and MySQL claim behavior with DB integration tests; keep
  SQLite as a local and single-process option.
- Keep shared SQL-core extraction deferred.

## 2.2.0

- Add the framework-free Prisma publish and received storage adapter.
- Add raw-SQL schema initialization for PostgreSQL, MySQL/MariaDB, and SQLite.
- Add interactive transaction support through `Prisma.TransactionClient`.
