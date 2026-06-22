import {
  type ServiceBusClient,
  type ServiceBusSender,
} from '@azure/service-bus';
import type {
  CapHeaders,
  CapLogger,
  PublishMetadata,
  PublisherPort,
} from '@mikara89/cap-core';
import { type ServiceBusConfig } from '../servicebus.config';

/**
 * Azure Service Bus implementation of PublisherPort.
 * Sends messages to Service Bus topics.
 */
export class ServiceBusPublisher implements PublisherPort {
  private readonly senders = new Map<string, ServiceBusSender>();

  constructor(
    private readonly client: ServiceBusClient,
    private readonly config: ServiceBusConfig,
    private readonly logger?: CapLogger,
  ) {}

  async initialize?(options?: {
    autoInit?: boolean;
    createQueues?: boolean;
  }): Promise<void> {
    if (!(options && (options.autoInit || options.createQueues)))
      return Promise.resolve();
    try {
      // Best-effort pre-warm: create a sender for the configured resource
      // (topic or queue) to ensure the client can create connections. This
      // does not provision Service Bus entities; management operations
      // require the Admin client.
      const prefix =
        this.config.mode === 'queue'
          ? (this.config.queuePrefix ?? this.config.topicPrefix ?? '')
          : (this.config.topicPrefix ?? '');
      const sampleName = prefix + 'init-check';
      const s = this.client.createSender(sampleName);
      await s.close();
      this.logger?.info?.(`Pre-warmed sender for ${sampleName}`);
    } catch (err) {
      this.logger?.warn?.(
        'ServiceBusPublisher.initialize() encountered an error',
        err as Error,
      );
    }
  }

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void> {
    const prefix =
      this.config.mode === 'queue'
        ? (this.config.queuePrefix ?? this.config.topicPrefix ?? '')
        : (this.config.topicPrefix ?? '');
    const topicName = prefix + topic;
    let sender = this.senders.get(topicName);

    if (!sender) {
      sender = this.client.createSender(topicName);
      this.senders.set(topicName, sender);
    }

    try {
      await sender.sendMessages({
        body: payload,
        messageId: metadata?.messageId,
        contentType: 'application/json',
        applicationProperties: headers,
      });
      this.logger?.debug?.(`sent to ${topicName}`);
    } catch (error) {
      this.logger?.error?.(`failed to send to ${topicName}`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    for (const [topic, sender] of this.senders.entries()) {
      try {
        await sender.close();
        this.logger?.debug?.(`closed sender for ${topic}`);
      } catch (error) {
        this.logger?.warn?.(`failed to close sender for ${topic}`, error);
      }
    }
    this.senders.clear();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
