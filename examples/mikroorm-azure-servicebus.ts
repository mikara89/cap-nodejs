import { DynamicModule, Module, Type } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CapAdapterModule, CapModule } from '@mikara89/cap-nest';
import {
  CapPublishEntity,
  CapReceivedEntity,
  MikroStorageModule,
} from '@mikara89/mikroorm-storage';
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';

type NestImport = DynamicModule | Promise<DynamicModule> | Type<unknown>;

export function createProductionCapImports(): NestImport[] {
  const serviceBusTransport = ServiceBusTransportModule.forRoot({
    connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING ?? '',
    topicPrefix: 'cap-',
    subscriptionPrefix: 'sub-',
  });

  return [
    MikroOrmModule.forRoot({
      dbName: process.env.DB_NAME ?? 'cap',
      entities: [CapPublishEntity, CapReceivedEntity],
    }),
    MikroStorageModule,
    serviceBusTransport,
    CapModule.forAdapters(
      MikroStorageModule,
      serviceBusTransport as unknown as CapAdapterModule,
      {
        createSchema: false,
        createQueues: false,
      },
    ),
  ];
}

@Module({})
export class ProductionCapExampleModule {
  static register(): DynamicModule {
    return {
      module: ProductionCapExampleModule,
      imports: createProductionCapImports(),
    };
  }
}
