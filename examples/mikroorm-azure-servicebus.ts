import { DynamicModule, Module, Type } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CapModule } from '@mikara89/cap-nest';
import {
  CapPublishEntity,
  CapReceivedEntity,
  MikroStorageModule,
} from '@mikara89/cap-storage-mikro-orm';
import { ServiceBusTransportModule } from '@mikara89/cap-transport-azure-servicebus';

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
    CapModule.forRoot({
      imports: [MikroStorageModule, serviceBusTransport],
      init: {
        createSchema: false,
        createQueues: false,
      },
    }),
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
