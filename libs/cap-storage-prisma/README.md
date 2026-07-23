# @mikara89/cap-storage-prisma

Framework-free Prisma storage adapter for CAP outbox and inbox persistence.

## Install

```sh
npm install @mikara89/cap-storage-prisma @prisma/client
```

Use the generated Prisma Client from your application. The adapter supports
Prisma providers `postgresql`, `mysql`, and `sqlite`; `postgres` and `mariadb`
are accepted adapter aliases. Pass the provider explicitly because Prisma does
not expose a stable public runtime provider API for adapter logic.

For the optional NestJS entry point, install the Nest peer dependencies used by
your application:

```sh
npm install @nestjs/common @nestjs/core reflect-metadata
```

Those dependencies are optional when using only the framework-neutral root
API.

## Schema

Initialize CAP tables through raw SQL without adding CAP models to your Prisma
schema:

```ts
import { initializePrismaCapStorage } from '@mikara89/cap-storage-prisma';

await initializePrismaCapStorage(prisma, { provider: 'postgresql' });
```

Custom table names are supported and validated as SQL identifiers:

```ts
await initializePrismaCapStorage(prisma, {
  provider: 'postgresql',
  publishTableName: 'cap_publish',
  receivedTableName: 'cap_received',
});
```

The helper creates outbox and inbox tables, scheduler indexes, and the unique
inbox constraint on `group + dedupeKey`. Applications may instead manage
equivalent tables with their own migrations. Prisma Migrate is not required
for CAP-owned tables.

Inbox recovery queries return due failed rows and, when core supplies a pending
cutoff, stale pending rows in one deterministic limited result. They do not
claim rows for execution; inbox processing remains at least once and callers
must keep subscriber handlers idempotent.

Outbox completion, failure, and active lease renewal use parameterized atomic
ownership predicates. `lockedBy` is an opaque per-claim token; stale owners
receive `false` and cannot mutate a reclaimed row. PostgreSQL and MySQL
multi-instance behavior is covered by the SQL integration gate. SQLite remains
for local and single-process use rather than multi-instance claim safety.

## Usage

```ts
import {
  PrismaPublishStorage,
  PrismaReceivedStorage,
} from '@mikara89/cap-storage-prisma';

const options = { provider: 'postgresql' as const };
const publishStorage = new PrismaPublishStorage(prisma, options);
const receivedStorage = new PrismaReceivedStorage(prisma, options);
```

The adapter uses `$executeRawUnsafe` and `$queryRawUnsafe` with parameterized
values. It does not use generated model delegates or require CAP models in the
application schema. Table names are the only dynamic identifiers and are
strictly validated before quoting.

### NestJS

The root import remains framework-neutral. Import Nest integration from the
explicit `@mikara89/cap-storage-prisma/nest` subpath; it exports
`PrismaStorageModule`, its `Options`/`AsyncOptions`/`OptionsFactory` types,
and the existing CAP `PUBLISH_STORAGE` and `RECEIVED_STORAGE` tokens.

The module binds `PrismaPublishStorage` and `PrismaReceivedStorage` to those
CAP tokens. It uses the injected application client and does not call
`$connect()` or `$disconnect()`: connection lifecycle remains application-owned.

Provide a direct application client under any token you choose. There is no
assumption about a provider called `PrismaService` or a particular Prisma Nest
library:

```ts
import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaStorageModule } from '@mikara89/cap-storage-prisma/nest';

export const APP_DATABASE = Symbol('APP_DATABASE');
const prisma = new PrismaClient();

@Module({
  providers: [{ provide: APP_DATABASE, useValue: prisma }],
  exports: [APP_DATABASE],
})
export class DatabaseModule {}

@Module({
  imports: [
    PrismaStorageModule.forRoot({
      imports: [DatabaseModule],
      clientToken: APP_DATABASE,
      storageOptions: { provider: 'postgresql' },
    }),
  ],
})
export class AppModule {}
```

An application-defined `PrismaService` works when it is exported under your
chosen token; CAP does not require a particular implementation:

```ts
import { Injectable, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {}

@Module({
  providers: [
    PrismaService,
    { provide: APP_DATABASE, useExisting: PrismaService },
  ],
  exports: [APP_DATABASE],
})
export class DatabaseModule {}
```

Use `forRootAsync` for application-provided storage options:

```ts
import { Module } from '@nestjs/common';
import type { PrismaStorageOptions } from '@mikara89/cap-storage-prisma';
import { PrismaStorageModule } from '@mikara89/cap-storage-prisma/nest';

export const STORAGE_OPTIONS = Symbol('STORAGE_OPTIONS');

@Module({
  providers: [
    { provide: STORAGE_OPTIONS, useValue: { provider: 'postgresql' } },
  ],
  exports: [STORAGE_OPTIONS],
})
class StorageConfigModule {}

PrismaStorageModule.forRootAsync({
  imports: [DatabaseModule, StorageConfigModule],
  clientToken: APP_DATABASE,
  inject: [STORAGE_OPTIONS],
  useFactory: (options: PrismaStorageOptions) => options,
});
```

The class and existing-provider variants call exactly
`createPrismaStorageOptions()`:

```ts
import { Injectable, Module } from '@nestjs/common';
import {
  PrismaStorageModule,
  type PrismaStorageOptionsFactory,
} from '@mikara89/cap-storage-prisma/nest';

@Injectable()
class PrismaOptionsFactory implements PrismaStorageOptionsFactory {
  createPrismaStorageOptions() {
    return { provider: 'postgresql' as const };
  }
}

@Module({ providers: [PrismaOptionsFactory], exports: [PrismaOptionsFactory] })
class ExistingConfigModule {}

PrismaStorageModule.forRootAsync({
  imports: [DatabaseModule],
  clientToken: APP_DATABASE,
  useClass: PrismaOptionsFactory,
});

PrismaStorageModule.forRootAsync({
  imports: [DatabaseModule, ExistingConfigModule],
  clientToken: APP_DATABASE,
  useExisting: PrismaOptionsFactory,
});
```

## Transactions

The transaction context is `Prisma.TransactionClient`. Root operations use the
application's root `PrismaClient`.

```ts
await prisma.$transaction(async (tx) => {
  await cap.publish('topic', payload, { tx });
});
```

An explicit operation context is also supported:

```ts
await prisma.$transaction(async (tx) => {
  await cap.publish('topic', payload, { ctx: { tx } });
});
```

`PrismaTransactionManager` implements
`CapTransactionManagerPort<Prisma.TransactionClient>`. It maps `timeoutMs` to
Prisma's interactive transaction timeout and accepts documented Prisma
isolation names that the selected provider supports. `afterCommit` callbacks
run after `$transaction` resolves; `afterRollback` callbacks run after it
rejects. CAP `propagation` and `readOnly` options are currently informational.

`savePublishWithTx(event, tx)` remains as deprecated compatibility only. Use
`savePublish(event, { tx })` through CAP publish options.

## Capabilities

Both storage classes implement `CapabilityAwareStoragePort`:

- transactions and provider-supported Prisma isolation levels are reported
- PostgreSQL and MySQL/MariaDB report skip-locked claiming because the adapter
  uses `FOR UPDATE SKIP LOCKED`
- SQLite reports no safe multi-instance claiming
- inbox dedupe reports atomic insert-ignore for every supported provider
- advisory locks and nested transactions are not reported

SQLite is intended for local development and tests. Its claiming fallback is
transactional but is not safe for multi-instance durable dispatch.

## Contract And Database Tests

The package runs `definePublishStorageContract` and
`defineReceivedStorageContract` against SQLite. PostgreSQL and MySQL
Testcontainers coverage verifies real skip-locked claiming, concurrent inbox
dedupe, and interactive transaction rollback.
