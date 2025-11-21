import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { IPublisher } from '@cap/cap-nest';
import { ServiceBusConfig } from '../servicebus.config';

/**
 * Azure Service Bus implementation of IPublisher.
 * Sends messages to Service Bus topics.
 */
@Injectable()
export class ServiceBusPublisher implements IPublisher, OnModuleDestroy {
  private readonly logger = new Logger(ServiceBusPublisher.name);
  private readonly senders = new Map<string, ServiceBusSender>();

  constructor(
    private readonly client: ServiceBusClient,
    @Inject('CAP_SERVICEBUS_CONFIG') private readonly config: ServiceBusConfig,
  ) {}

  async emit(topic: string, payload: unknown): Promise<void> {
    const topicName = this.config.topicPrefix + topic;
    let sender = this.senders.get(topicName);

    if (!sender) {
      sender = this.client.createSender(topicName);
      this.senders.set(topicName, sender);
    }

    try {
      await sender.sendMessages({
        body: payload,
        contentType: 'application/json',
      });
      this.logger.debug(`✓ sent to ${topicName}`);
    } catch (error) {
      this.logger.error(`✗ failed to send to ${topicName}`, error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const [topic, sender] of this.senders.entries()) {
      try {
        await sender.close();
        this.logger.debug(`closed sender for ${topic}`);
      } catch (error) {
        this.logger.warn(`failed to close sender for ${topic}`, error);
      }
    }
    this.senders.clear();
  }
}
