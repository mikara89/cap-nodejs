import { DynamicModule, Module } from '@nestjs/common';
import { ServiceBusClient } from '@azure/service-bus';
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
 * import { ServiceBusTransportModule } from '@cap/transport-azure-servicebus';
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

          useFactory: () => new ServiceBusClient(config.connectionString),
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

  static get providers() {
    // Expose providers array for CapModule.forAdapters() compatibility
    // Note: This requires config to be injected separately
    throw new Error(
      'Use ServiceBusTransportModule.forRoot(config) instead of accessing providers directly',
    );
  }
}
