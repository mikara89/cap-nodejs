# Getting Started

Use this guide to wire CAP into a NestJS application.

## Local In-Memory Setup

The in-memory bundle is the fastest way to try CAP in tests or local examples.
It keeps outbox/inbox records in memory and uses an in-process bus.

```ts
import { Module } from '@nestjs/common';
import { CapModule } from '@mikara89/cap-nest';

@Module({
  imports: [CapModule.forInMemory()],
})
export class AppModule {}
```

Publish from any injectable that receives `CapService`:

```ts
import { Injectable } from '@nestjs/common';
import { CapService } from '@mikara89/cap-nest';

@Injectable()
export class UsersService {
  constructor(private readonly cap: CapService) {}

  async createUser(): Promise<void> {
    await this.cap.publish('user.created', {
      id: 'u1',
      email: 'alice@example.com',
    });
  }
}
```

Handle messages with `@CapSubscribe`:

```ts
import { Injectable } from '@nestjs/common';
import {
  CapHeaders as CapHeadersParam,
  CapSubscribe,
  type CapHeaders,
} from '@mikara89/cap-nest';

@Injectable()
export class MailHandler {
  @CapSubscribe({ topic: 'user.created', group: 'mail-service' })
  async handleUserCreated(
    payload: { id: string; email: string },
    @CapHeadersParam() headers?: CapHeaders,
  ) {
    // send welcome email
  }
}
```

## Production-Style Setup

Production apps should provide durable storage and an external transport. The
first-party packages are MikroORM storage and Azure Service Bus transport.

> Warning: multi-instance durable outbox dispatch requires a lock-capable
> MikroORM SQL driver such as PostgreSQL or MySQL, or a custom storage adapter
> with equivalent claim safety. SQLite and other local/non-locking drivers are
> supported only for demos, development, and single-process tests.

```ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CapModule } from '@mikara89/cap-nest';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/mikroorm-storage';
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';

const serviceBusTransport = ServiceBusTransportModule.forRoot({
  connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
  topicPrefix: 'cap-',
  subscriptionPrefix: 'sub-',
});

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: process.env.DB_NAME,
      entities: [CapPublishEntity, CapReceivedEntity],
    }),
    MikroStorageModule,
    serviceBusTransport,
    CapModule.forRoot({
      imports: [MikroStorageModule, serviceBusTransport],
      init: {
        createSchema: false,
        createQueues: false,
      },
    }),
  ],
})
export class AppModule {}
```

Use environment variables for secrets. Do not commit Service Bus connection
strings or database credentials.

## Dashboard Setup

The dashboard is optional and must be protected by a guard.

```ts
import { CapDashboardModule } from '@mikara89/cap-dashboard';

@Module({
  imports: [
    CapDashboardModule.forRoot({
      guard: {
        provide: 'CAP_DASHBOARD_GUARD',
        useValue: { canActivate: () => true },
      },
      authorizer: {
        provide: 'CAP_DASHBOARD_AUTHORIZER',
        useValue: ({ permission }) => permission === 'read',
      },
      routePrefix: '/api/cap',
      uiRoute: '/cap-dashboard',
    }),
  ],
})
export class AppModule {}
```

Replace the sample guard and authorizer with real application policy before
exposing the dashboard outside local development.
