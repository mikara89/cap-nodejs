import { DynamicModule, Module } from '@nestjs/common';
import { ServiceBusClient } from '@azure/service-bus';
import { PUBLISHER, SUBSCRIBER } from '@mikara89/cap-core';
import { ServiceBusClientLifecycle } from './servicebus-client.lifecycle';
import { ServiceBusConfig } from '../servicebus.config';
import { ServiceBusPublisher } from '../transport/servicebus-publisher';
import { ServiceBusSubscriber } from '../transport/servicebus-subscriber';
import { SERVICEBUS_CLIENT, SERVICEBUS_CLIENT_LIFECYCLE } from './tokens';

/**
 * NestJS module providing Azure Service Bus transport adapters for CAP.
 */
@Module({})
export class ServiceBusTransportModule {
  static forRoot(config: ServiceBusConfig): DynamicModule {
    return {
      module: ServiceBusTransportModule,
      providers: [
        {
          provide: SERVICEBUS_CLIENT,
          useFactory: (): ServiceBusClient => {
            if (
              process.env.NODE_ENV === 'test' &&
              process.env.CAP_USE_REAL_SERVICEBUS_CLIENT !== 'true'
            ) {
              const dummy = {
                createReceiver: () => ({
                  subscribe: () => ({
                    close: async (): Promise<void> => {},
                  }),
                  close: async (): Promise<void> => {},
                }),
                createSender: () => ({
                  sendMessages: async (): Promise<void> => {},
                  close: async (): Promise<void> => {},
                }),
                close: async (): Promise<void> => {},
              };
              return dummy as unknown as ServiceBusClient;
            }

            return new ServiceBusClient(config.connectionString);
          },
        },
        {
          provide: SERVICEBUS_CLIENT_LIFECYCLE,
          useClass: ServiceBusClientLifecycle,
        },
        {
          provide: PUBLISHER,
          useFactory: (client: ServiceBusClient) =>
            new ServiceBusPublisher(client, config),
          inject: [SERVICEBUS_CLIENT],
        },
        {
          provide: SUBSCRIBER,
          useFactory: (client: ServiceBusClient) =>
            new ServiceBusSubscriber(client, config),
          inject: [SERVICEBUS_CLIENT],
        },
      ],
      exports: [PUBLISHER, SUBSCRIBER],
    };
  }
}
