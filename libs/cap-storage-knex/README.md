# @mikara89/cap-storage-knex

Knex storage adapter for CAP outbox and inbox persistence.

## Install

```sh
npm install @mikara89/cap-storage-knex knex
```

Install the Knex dialect driver your application uses, for example `pg`,
`mysql2`, `mariadb`, or `better-sqlite3`.

## Schema

Create the CAP tables during application setup or migrations:

```ts
import { createKnexCapSchema } from '@mikara89/cap-storage-knex';

await createKnexCapSchema(knex);
```

Custom table names are supported:

```ts
await createKnexCapSchema(knex, {
  publishTableName: 'cap_publish',
  receivedTableName: 'cap_received',
});
```

The schema creates:

- `cap_publish` for outbox records, retry state, and claim leases
- `cap_received` for inbox records and retry/dead-letter state
- a unique received constraint on `group + dedupeKey`
- indexes for publish claiming and inbox retry reads

## Usage

```ts
import {
  KnexPublishStorage,
  KnexReceivedStorage,
} from '@mikara89/cap-storage-knex';

const publishStorage = new KnexPublishStorage(knex);
const receivedStorage = new KnexReceivedStorage(knex);
```

Wire these instances to CAP through the `PUBLISH_STORAGE` and
`RECEIVED_STORAGE` ports in your application framework.

## Transactions

`savePublish(event, ctx?)` is the primary transaction-aware API. CAP will pass
the operation context when you publish with `tx` or `ctx`.

Explicit transaction handle:

```ts
await knex.transaction(async (tx) => {
  await cap.publish('topic', payload, { tx });
});
```

Explicit operation context:

```ts
await knex.transaction(async (tx) => {
  await cap.publish('topic', payload, { ctx: { tx } });
});
```

The package also exports `KnexTransactionManager` for applications that want a
`CapTransactionManagerPort<Knex.Transaction>` implementation.

`savePublishWithTx(event, tx)` remains as deprecated compatibility only. Prefer
`savePublish(event, { tx })` through CAP publish options.

## Capabilities

`KnexPublishStorage` and `KnexReceivedStorage` implement
`CapabilityAwareStoragePort`.

Capabilities are conservative:

- transactions are reported as supported
- skip-locked claiming is reported only for PostgreSQL/MySQL/MariaDB clients
- advisory locks are not implemented
- atomic insert-ignore is not reported
- nested transactions are not reported
- isolation levels are reported only for PostgreSQL/MySQL/MariaDB clients

SQLite is supported for local development and tests. It does not report safe
multi-instance outbox claiming and should not be used for multi-instance
durable dispatch without an application-specific locking strategy.

## Supported Dialects

The adapter is designed for PostgreSQL, MySQL/MariaDB, and SQLite-compatible
Knex clients. PostgreSQL and MySQL/MariaDB use Knex row locking with
`skipLocked()` for outbox claiming when available. SQLite uses a conservative
transactional fallback for local and single-process usage.

## Contract Tests

The package runs both shared storage contracts:

- `definePublishStorageContract`
- `defineReceivedStorageContract`

Adapter-specific tests also cover explicit transaction usage, rollback,
deprecated `savePublishWithTx` compatibility, received dedupe behavior,
`markProcessed(processedAt)`, `getRetryDue(now)`, schema creation, and
conservative SQLite capabilities.
