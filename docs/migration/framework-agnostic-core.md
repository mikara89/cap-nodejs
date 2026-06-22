# Framework-Agnostic Core Migration

CAP now separates framework-independent core behavior from NestJS and Express
bindings. Existing NestJS applications can keep using `@mikara89/cap-nest`,
while storage, transport, dashboard, and testing packages now use `cap-*`
package names.

## Old Nest Imports

```ts
import { CapModule, CapService } from '@mikara89/cap-nest';
import { MikroStorageModule } from '@mikara89/mikroorm-storage';
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';
```

## New Nest Imports

```ts
import { CapModule, CapService } from '@mikara89/cap-nest';
import { MikroStorageModule } from '@mikara89/cap-storage-mikro-orm';
import { ServiceBusTransportModule } from '@mikara89/cap-transport-azure-servicebus';
```

`@mikara89/cap-nest` still re-exports compatible CAP models, ports, and core
types for existing Nest users.

## New Core Import

```ts
import { CapEngine } from '@mikara89/cap-core';
```

Use `CapEngine` directly when building a framework adapter, custom worker, or
non-HTTP process. Provide framework-free storage and transport implementations
through the core ports.

## New Express Usage

```ts
import express from 'express';
import { createCapExpress } from '@mikara89/cap-express';

const app = express();

const cap = createCapExpress({
  publishStorage,
  receivedStorage,
  publisher,
  subscriber,
  scheduler: {
    outboxIntervalMs: 5000,
    inboxRetryIntervalMs: 10000,
    maxRetries: 3,
    maxInboxRetries: 3,
    leaseMs: 30000,
  },
});

await cap.start();

app.use('/health', cap.healthRouter());

process.on('SIGTERM', async () => {
  await cap.stop();
});
```

## Package Renames

```txt
@mikara89/mikroorm-storage -> @mikara89/cap-storage-mikro-orm
@mikara89/azure-servicebus-transport -> @mikara89/cap-transport-azure-servicebus
@mikara89/nestjs-microservices-transport -> @mikara89/cap-transport-nestjs-microservices
@mikara89/cap-dashboard -> @mikara89/cap-dashboard-nest
```

`@mikara89/cap-dashboard` remains as a compatibility alias for the Nest
dashboard package during the migration.
