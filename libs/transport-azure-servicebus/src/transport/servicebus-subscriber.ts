import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ProcessErrorArgs,
} from '@azure/service-bus';
import { ISubscriber } from '@cap/cap-nest';

@Injectable()
export class ServiceBusSubscriber implements ISubscriber, OnModuleDestroy {
  private readonly logger = new Logger(ServiceBusSubscriber.name);
  private readonly receivers = new Map<string, ServiceBusReceiver>();
  private readonly topicPrefix: string;
  private readonly subscriptionPrefix: string;

  constructor(
    private readonly client: ServiceBusClient,
    configOrTopicPrefix?:
      | {
          connectionString?: string;
          topicPrefix?: string;
          subscriptionPrefix?: string;
        }
      | string,
    subscriptionPrefix?: string,
  ) {
    if (typeof configOrTopicPrefix === 'string') {
      this.topicPrefix = configOrTopicPrefix;
      this.subscriptionPrefix = subscriptionPrefix ?? 'sub-';
    } else {
      this.topicPrefix = configOrTopicPrefix?.topicPrefix ?? 'cap-';
      this.subscriptionPrefix =
        configOrTopicPrefix?.subscriptionPrefix ?? 'sub-';
    }
  }

  async consume(
    topic: string,
    group: string,
    onMessage: (
      payload: unknown,
      properties?: Record<string, unknown>,
    ) => Promise<void>,
  ): Promise<void> {
    const topicName = this.topicPrefix + topic;
    const subscriptionName = this.subscriptionPrefix + group;
    const key = `${topicName}/${subscriptionName}`;

    if (this.receivers.has(key)) {
      this.logger.warn(`Subscriber already exists for ${key}`);
      return Promise.resolve();
    }

    const receiver = this.client.createReceiver(topicName, subscriptionName);
    this.receivers.set(key, receiver);

    receiver.subscribe({
      processMessage: async (message) => {
        try {
          const body = (message as { body?: unknown }).body;
          const properties =
            (message as { applicationProperties?: Record<string, unknown> })
              .applicationProperties ?? {};
          await onMessage(body, properties);
          this.logger.debug(`✓ processed message from ${key}`);
        } catch (error) {
          this.logger.error(`✗ handler failed for ${key}`, error);
          throw error;
        }
      },
      processError: async (args: ProcessErrorArgs) => {
        this.logger.error(
          `Error from ${key}: ${args?.errorSource}`,
          args?.error,
        );
        await Promise.resolve();
      },
    });

    this.logger.log(`subscribed to ${key}`);
    return Promise.resolve();
  }

  async onModuleDestroy() {
    for (const [key, receiver] of this.receivers.entries()) {
      try {
        await receiver.close();
        this.logger.debug(`closed receiver for ${key}`);
      } catch (error) {
        this.logger.warn(`failed to close receiver for ${key}`, error);
      }
    }
    this.receivers.clear();
  }
}
