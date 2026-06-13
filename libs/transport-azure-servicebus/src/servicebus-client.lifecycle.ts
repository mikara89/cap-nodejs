import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { ServiceBusClient } from '@azure/service-bus';

@Injectable()
export class ServiceBusClientLifecycle implements OnModuleDestroy {
  private readonly logger = new Logger(ServiceBusClientLifecycle.name);

  constructor(
    @Inject('SERVICEBUS_CLIENT') private readonly client: ServiceBusClient,
  ) {}

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client && typeof this.client.close === 'function') {
        await this.client.close();
        this.logger.debug('ServiceBusClient closed by lifecycle provider');
      }
    } catch (err) {
      this.logger.warn(
        'Error closing ServiceBusClient in lifecycle provider',
        err as Error,
      );
    }
  }
}
