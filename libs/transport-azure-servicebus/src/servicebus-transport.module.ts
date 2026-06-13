import { DynamicModule, Module } from '@nestjs/common';
import { ServiceBusClient } from '@azure/service-bus';
import { ServiceBusClientLifecycle } from './servicebus-client.lifecycle';
import { PUBLISHER, SUBSCRIBER } from '@cap/cap-nest';
import { ServiceBusPublisher } from './transport/servicebus-publisher';
import { ServiceBusSubscriber } from './transport/servicebus-subscriber';
import { ServiceBusConfig } from './servicebus.config';

/**
 * NestJS module providing Azure Service Bus transport adapters for CAP.
 *
 * Usage:
 * ```ts
 * import { CapModule } from '@cap/cap-nest';
 * import { ServiceBusTransportModule } from '@cap/azure-servicebus-transport';
 *
 * @Module({
 *   imports: [
 *     CapModule.forAdapters(
 *       storageModule,
 *       ServiceBusTransportModule.forRoot({
 *         connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING!,
 *         topicPrefix: 'cap-',
 *       }),
 *     ),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ServiceBusTransportModule {
  static forRoot(config: ServiceBusConfig): DynamicModule {
    return {
      module: ServiceBusTransportModule,
      providers: [
        {
          provide: 'SERVICEBUS_CLIENT',
          useFactory: (): ServiceBusClient => {
            // In test runs, avoid opening real network connections — return a no-op/dummy client.
            if (process.env.NODE_ENV === 'test') {
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
          provide: 'SERVICEBUS_CLIENT_LIFECYCLE',
          useClass: ServiceBusClientLifecycle,
        },
        {
          provide: PUBLISHER,
          useFactory: (client: ServiceBusClient) =>
            new ServiceBusPublisher(client, config),
          inject: ['SERVICEBUS_CLIENT'],
        },
        {
          provide: SUBSCRIBER,
          useFactory: (client: ServiceBusClient) =>
            new ServiceBusSubscriber(client, config),
          inject: ['SERVICEBUS_CLIENT'],
        },
      ],
      exports: [PUBLISHER, SUBSCRIBER],
    };
  }
}
