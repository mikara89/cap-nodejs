# @mikara89/cap-storage-typeorm

## Messaging administration

`TypeOrmPublishStorage` and `TypeOrmReceivedStorage` implement the optional CAP
administration ports. Only failed/dead-letter rows are guardedly requeued and
made immediately due; successful or active rows are rejected. Snapshots are
aggregate status counts with oldest current pending/failed `created_at` values.

TypeORM storage adapter for CAP outbox and inbox persistence.

## Install

```sh
npm install @mikara89/cap-storage-typeorm typeorm
```

Install the TypeORM dialect driver your application uses, for example `pg`,
`mysql2`, `mariadb`, or `better-sqlite3`.

For the optional NestJS entry point, install the Nest peer dependencies,
including `@nestjs/typeorm`:

```sh
npm install @nestjs/common @nestjs/core @nestjs/typeorm reflect-metadata
```

They are optional for framework-neutral root imports.

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

Inbox recovery queries return due failed rows and, when core supplies a pending
cutoff, stale pending rows in one deterministic limited result. They do not
claim rows for execution; inbox processing remains at least once and callers
must keep subscriber handlers idempotent.

Outbox completion, failure, and active lease renewal use atomic ownership
predicates. `lockedBy` is an opaque per-claim token; stale owners receive
`false` and cannot mutate a row reclaimed by another worker. PostgreSQL and
MySQL multi-instance behavior is covered by the SQL integration gate. SQLite
remains suitable for local and single-process use, not multi-instance claim
safety.

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

### NestJS

The package root remains framework-neutral. The explicit
`@mikara89/cap-storage-typeorm/nest` entry point exports
`TypeOrmStorageModule`, its `Options`/`AsyncOptions`/`OptionsFactory` types,
and the existing CAP `PUBLISH_STORAGE` and `RECEIVED_STORAGE` tokens.

The module binds exported `TypeOrmPublishStorage` and `TypeOrmReceivedStorage`
to those two CAP tokens. It uses an existing TypeORM `DataSource`; it does not
initialize or destroy that data source.

For the default data source, nest the TypeORM registration in the storage
module's imports:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmStorageModule } from '@mikara89/cap-storage-typeorm/nest';

@Module({
  imports: [
    TypeOrmStorageModule.forRoot({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.DATABASE_URL,
        }),
      ],
      storageOptions: { publishTableName: 'cap_publish' },
    }),
  ],
})
export class AppModule {}
```

For a named data source, pass the same name. The storage module uses
`getDataSourceToken(name)` from `@nestjs/typeorm` internally, so application
code can use that token too:

```ts
import { Inject, Injectable, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmStorageModule } from '@mikara89/cap-storage-typeorm/nest';

const REPORTING = 'reporting';

@Injectable()
class ReportingService {
  constructor(
    @Inject(getDataSourceToken(REPORTING)) readonly dataSource: DataSource,
  ) {}
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: REPORTING,
      type: 'postgres',
      url: process.env.REPORTING_DATABASE_URL,
    }),
  ],
  exports: [TypeOrmModule],
})
class ReportingDatabaseModule {}

@Module({
  imports: [
    ReportingDatabaseModule,
    TypeOrmStorageModule.forRoot({
      imports: [ReportingDatabaseModule],
      dataSource: REPORTING,
    }),
  ],
  providers: [ReportingService],
})
export class ReportingModule {}
```

`forRootAsync` resolves only storage options; the data-source registration is
still application-owned:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmStorageOptions } from '@mikara89/cap-storage-typeorm';
import { TypeOrmStorageModule } from '@mikara89/cap-storage-typeorm/nest';

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
class StorageConfigModule {}

TypeOrmStorageModule.forRootAsync({
  imports: [
    TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL }),
    StorageConfigModule,
  ],
  inject: [STORAGE_OPTIONS],
  useFactory: (options: TypeOrmStorageOptions) => options,
});
```

The class and existing-provider forms call exactly
`createTypeOrmStorageOptions()`:

```ts
import { Injectable, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TypeOrmStorageModule,
  type TypeOrmStorageOptionsFactory,
} from '@mikara89/cap-storage-typeorm/nest';

@Injectable()
class TypeOrmOptionsFactory implements TypeOrmStorageOptionsFactory {
  createTypeOrmStorageOptions() {
    return { publishTableName: 'cap_publish' };
  }
}

@Module({
  providers: [TypeOrmOptionsFactory],
  exports: [TypeOrmOptionsFactory],
})
class ExistingConfigModule {}

TypeOrmStorageModule.forRootAsync({
  imports: [
    TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL }),
  ],
  useClass: TypeOrmOptionsFactory,
});

TypeOrmStorageModule.forRootAsync({
  imports: [
    TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL }),
    ExistingConfigModule,
  ],
  useExisting: TypeOrmOptionsFactory,
});
```

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
behavior, `markProcessed(processedAt)`, `getRetryDue(limit, now?, pendingBefore?)`, schema creation,
and conservative SQLite capabilities.
