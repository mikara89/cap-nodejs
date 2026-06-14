import { Module } from '@nestjs/common';
// path utilities are no longer required here; CapDashboardModule will resolve defaults
import { MikroOrmModule } from '@mikro-orm/nestjs';
import type { Options as MikroOptions } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { CapTestAppController } from './cap-test-app.controller';
import { CapTestAppService } from './cap-test-app.service';
import {
  CapModule,
  CapAdapterModule,
  LocalBus,
  PUBLISHER,
  SUBSCRIBER,
} from '@mikara89/cap-nest';
import { CapExampleHandler } from './cap-example.handler';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '../../../libs/storage-mikro-orm/src';
// Note: schema creation is handled via CapModule init options.
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';
import { CapDashboardModule } from '@mikara89/cap-dashboard';

const serviceBusConnectionString =
  process.env.SERVICEBUS_CONNECTION_STRING ??
  process.env.AZURE_SERVICEBUS_CONNECTION_STRING;

const useServiceBus = Boolean(serviceBusConnectionString);

const localTransport: CapAdapterModule = {
  providers: [
    { provide: PUBLISHER, useClass: LocalBus },
    { provide: SUBSCRIBER, useExisting: PUBLISHER },
  ],
};

const serviceBusTransport = useServiceBus
  ? ServiceBusTransportModule.forRoot({
      connectionString: serviceBusConnectionString ?? '',
      maxConcurrentCalls: 10,
      subscriptionPrefix: process.env.CAP_SUBSCRIPTION_PREFIX ?? 'sub-',
      mode: process.env.CAP_SERVICEBUS_MODE === 'topic' ? 'topic' : 'queue',
      queuePrefix: process.env.CAP_QUEUE_PREFIX ?? 'cap-',
      topicPrefix: process.env.CAP_TOPIC_PREFIX ?? 'cap-',
    })
  : undefined;

const transportModule = serviceBusTransport ?? localTransport;

@Module({
  imports: [
    // MikroORM configured to use an in-memory SQLite database for tests
    MikroOrmModule.forRootAsync({
      useFactory: (): MikroOptions => ({
        driver: BetterSqliteDriver,
        dbName: ':memory:',
        entities: [CapPublishEntity, CapReceivedEntity],
        allowGlobalContext: true,
      }),
    }),
    // ensure the storage module registers the entities with MikroORM
    MikroStorageModule,
    // register CAP using the Mikro storage adapter and in-memory transport

    ...(serviceBusTransport ? [serviceBusTransport] : []),
    CapModule.forAdapters(
      MikroStorageModule,
      transportModule as unknown as CapAdapterModule,
      {
        autoInit: false,
        createQueues: useServiceBus && process.env.CAP_CREATE_QUEUES === 'true',
        createSchema: true,
      },
    ),
    CapDashboardModule.forRoot({
      guard: {
        provide: 'CAP_DASHBOARD_DEMO_GUARD',
        useValue: { canActivate: () => true },
      },
      routePrefix: '/api/cap', // default
      uiRoute: '/cap-dashboard', // default
      serveStatic: true, // default true
    }),
  ],
  controllers: [CapTestAppController],
  providers: [CapTestAppService, CapExampleHandler],
})
export class CapTestAppModule {}
