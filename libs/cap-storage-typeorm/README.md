# @mikara89/cap-storage-typeorm

TypeORM storage adapter for CAP outbox and inbox persistence.

## Install

```sh
npm install @mikara89/cap-storage-typeorm typeorm
```

Install the TypeORM dialect driver your application uses, for example `pg`,
`mysql2`, `mariadb`, or `better-sqlite3`.

## Schema

Create the CAP tables during application setup or migrations:

```ts
import { createTypeOrmCapSchema } from '@mikara89/cap-storage-typeorm';

await createTypeOrmCapSchema(dataSource);
```

Custom table names are supported:

```ts
await createTypeOrmCapSchema(dataSource, {
  publishTableName: 'cap_publish',
  receivedTableName: 'cap_received',
});
```

The schema creates:

- `cap_publish` for outbox records, retry state, and claim leases
- `cap_received` for inbox records and retry/dead-letter state
- a unique received constraint on `group + dedupeKey`
- indexes for publish claiming and inbox retry reads

The schema helper uses TypeORM `QueryRunner` table APIs and does not require
decorators or entities.

## Usage

```ts
import {
  TypeOrmPublishStorage,
  TypeOrmReceivedStorage,
} from '@mikara89/cap-storage-typeorm';

const publishStorage = new TypeOrmPublishStorage(dataSource);
const receivedStorage = new TypeOrmReceivedStorage(dataSource);
```

Wire these instances to CAP through the `PUBLISH_STORAGE` and
`RECEIVED_STORAGE` ports in your application framework.

## Transactions

`savePublish(event, ctx?)` is the primary transaction-aware API. The TypeORM
transaction context type is `EntityManager`.

Explicit transaction handle:

```ts
await dataSource.transaction(async (manager) => {
  await cap.publish('topic', payload, { tx: manager });
});
```

Explicit operation context:

```ts
await dataSource.transaction(async (manager) => {
  await cap.publish('topic', payload, { ctx: { tx: manager } });
});
```

Root/non-transactional operations use `dataSource.manager`.

The package also exports `TypeOrmTransactionManager` for applications that want
a `CapTransactionManagerPort<EntityManager>` implementation. It uses
`dataSource.transaction(...)` and supports `afterCommit`/`afterRollback`
callbacks after TypeORM resolves or rejects the transaction callback.

`savePublishWithTx(event, manager)` remains as deprecated compatibility only.
Prefer `savePublish(event, { tx })` through CAP publish options.

## Capabilities

`TypeOrmPublishStorage` and `TypeOrmReceivedStorage` implement
`CapabilityAwareStoragePort`.

Capabilities are conservative:

- transactions are reported as supported
- skip-locked claiming is reported only for PostgreSQL/MySQL/MariaDB-compatible
  TypeORM drivers where the adapter applies pessimistic write locking with
  `skip_locked`
- advisory locks are not implemented
- atomic insert-ignore is not reported
- nested transactions are not reported
- isolation levels are not advertised by the adapter

SQLite is supported for local development and tests. It does not report safe
multi-instance outbox claiming and should not be used for multi-instance
durable dispatch without an application-specific locking strategy.

## Supported Dialects

The adapter is designed for PostgreSQL, MySQL/MariaDB, and SQLite-compatible
TypeORM data sources. PostgreSQL and MySQL/MariaDB use TypeORM pessimistic
write locks with `skip_locked` for outbox claiming when available. SQLite uses
a conservative transactional fallback for local and single-process usage.

## Contract Tests

The package runs both shared storage contracts:

- `definePublishStorageContract`
- `defineReceivedStorageContract`

Adapter-specific tests also cover explicit `EntityManager` transaction usage,
rollback, deprecated `savePublishWithTx` compatibility, received dedupe
behavior, `markProcessed(processedAt)`, `getRetryDue(now)`, schema creation,
and conservative SQLite capabilities.
