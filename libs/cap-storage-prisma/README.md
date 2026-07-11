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

Nest integration is available only from the explicit `/nest` subpath. Supply
your application's actual Prisma client token; no provider class name is
assumed:

```ts
import { PrismaStorageModule } from '@mikara89/cap-storage-prisma/nest';

PrismaStorageModule.forRoot({
  imports: [DatabaseModule],
  clientToken: APP_DATABASE,
  storageOptions: { provider: 'postgresql' },
});
```

`forRootAsync` supports `imports`, `inject`, and `useFactory`, as well as
`useClass` and `useExisting` option factories. No third-party Prisma Nest
wrapper is required.

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
