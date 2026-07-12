# @mikara89/cap-storage-knex

Knex storage adapter for CAP outbox and inbox persistence.

## Install

```sh
npm install @mikara89/cap-storage-knex knex
```

Install the Knex dialect driver your application uses, for example `pg`,
`mysql2`, `mariadb`, or `better-sqlite3`.

For the optional NestJS entry point, also install the Nest peer dependencies
used by your application:

```sh
npm install @nestjs/common @nestjs/core reflect-metadata
```

Those Nest dependencies are optional: importing the package root does not load
NestJS.

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

Outbox completion, failure, and active lease renewal use atomic ownership
predicates. `lockedBy` is an opaque per-claim token; stale owners receive
`false` and cannot mutate a row reclaimed by another worker. PostgreSQL and
MySQL multi-instance behavior is covered by the SQL integration gate. SQLite
remains suitable for local and single-process use, not multi-instance claim
safety.

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

### NestJS

The root import above remains framework-neutral. Import Nest integration only
from `@mikara89/cap-storage-knex/nest`; it exports `KnexStorageModule`,
`KnexStorageModuleOptions`, `KnexStorageModuleAsyncOptions`,
`KnexStorageOptionsFactory`, and the existing CAP `PUBLISH_STORAGE` and
`RECEIVED_STORAGE` tokens.

`KnexStorageModule` creates and exports `KnexPublishStorage` and
`KnexReceivedStorage` under those two CAP tokens. It does not create, connect,
destroy, or otherwise own the Knex instance.

Register an application-owned Knex instance through an imported module. The
provider module must export the token because the storage module resolves it
through its own `imports`:

```ts
import { Module } from '@nestjs/common';
import { KnexStorageModule } from '@mikara89/cap-storage-knex/nest';
import { knex } from './knex-client';

export const APP_KNEX = Symbol('APP_KNEX');

@Module({
  providers: [{ provide: APP_KNEX, useValue: knex }],
  exports: [APP_KNEX],
})
export class DatabaseModule {}

@Module({
  imports: [
    KnexStorageModule.forRoot({
      imports: [DatabaseModule],
      knexToken: APP_KNEX,
      storageOptions: { publishTableName: 'cap_publish' },
    }),
  ],
})
export class AppModule {}
```

`APP_KNEX` is an application-defined token; it can represent any custom Knex
provider token. No third-party Knex Nest wrapper is required.

Use `forRootAsync` when storage options come from an injected application
provider. The Knex instance token is still explicit:

```ts
import { Module } from '@nestjs/common';
import type { KnexStorageOptions } from '@mikara89/cap-storage-knex';
import { KnexStorageModule } from '@mikara89/cap-storage-knex/nest';

export const STORAGE_OPTIONS = Symbol('STORAGE_OPTIONS');

@Module({
  providers: [
    {
      provide: STORAGE_OPTIONS,
      useValue: { receivedTableName: 'cap_received' },
    },
  ],
  exports: [STORAGE_OPTIONS],
})
export class StorageConfigModule {}

KnexStorageModule.forRootAsync({
  imports: [DatabaseModule, StorageConfigModule],
  knexToken: APP_KNEX,
  inject: [STORAGE_OPTIONS],
  useFactory: (options: KnexStorageOptions) => options,
});
```

The factory-class and existing-provider variants call exactly
`createKnexStorageOptions()`:

```ts
import { Injectable, Module } from '@nestjs/common';
import {
  KnexStorageModule,
  type KnexStorageOptionsFactory,
} from '@mikara89/cap-storage-knex/nest';

@Injectable()
class KnexOptionsFactory implements KnexStorageOptionsFactory {
  createKnexStorageOptions() {
    return { publishTableName: 'cap_publish' };
  }
}

@Module({ providers: [KnexOptionsFactory], exports: [KnexOptionsFactory] })
class ExistingConfigModule {}

KnexStorageModule.forRootAsync({
  imports: [DatabaseModule],
  knexToken: APP_KNEX,
  useClass: KnexOptionsFactory,
});

KnexStorageModule.forRootAsync({
  imports: [DatabaseModule, ExistingConfigModule],
  knexToken: APP_KNEX,
  useExisting: KnexOptionsFactory,
});
```

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
