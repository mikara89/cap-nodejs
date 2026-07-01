import type {
  CapHandler,
  CapHeaders,
  InitOptions,
  SubscriberPort,
  SubscribeMetadata,
} from '@mikara89/cap-core';
import {
  queueName,
  resolveRabbitMqOptions,
  validateRoutingKey,
} from './rabbitmq-config';
import {
  RabbitMqDisconnectedError,
  RabbitMqMalformedMessageError,
} from './rabbitmq-errors';
import type {
  RabbitMqOptions,
  ResolvedRabbitMqOptions,
} from './rabbitmq-options';
import { reportConnectionError, retryConnection } from './rabbitmq-retry';
import type {
  RabbitMqConnection,
  RabbitMqConsumerChannel,
  RabbitMqMessage,
  RabbitMqQueueOptions,
} from './rabbitmq-types';

interface Subscription {
  topic: string;
  group: string;
  handler: CapHandler;
}

interface GroupConsumer {
  queue: string;
  consumerTag?: string;
}

export class RabbitMqSubscriber implements SubscriberPort {
  private readonly options: ResolvedRabbitMqOptions;
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly groups = new Map<string, GroupConsumer>();
  private connection?: RabbitMqConnection;
  private channel?: RabbitMqConsumerChannel;
  private initializePromise?: Promise<void>;
  private recoveryPromise?: Promise<void>;
  private disposed = false;

  private readonly onConnectionError = (error: unknown): void => {
    reportConnectionError(this.options.logger, 'Subscriber', error);
  };

  private readonly onConnectionClose = (): void => {
    this.options.logger?.warn?.('RabbitMQ subscriber connection closed');
    const channel = this.channel;
    this.detachConnection();
    this.detachChannel();
    this.connection = undefined;
    this.channel = undefined;
    this.groups.clear();
    if (channel) void channel.close().catch(() => undefined);
    this.scheduleRecovery();
  };

  private readonly onChannelError = (error: unknown): void => {
    this.options.logger?.error?.('RabbitMQ subscriber channel error', error);
  };

  private readonly onChannelClose = (): void => {
    this.options.logger?.warn?.('RabbitMQ subscriber channel closed');
    const connection = this.connection;
    this.detachChannel();
    this.detachConnection();
    this.channel = undefined;
    this.connection = undefined;
    this.groups.clear();
    if (connection) void connection.close().catch(() => undefined);
    this.scheduleRecovery();
  };

  constructor(options: RabbitMqOptions = {}) {
    this.options = resolveRabbitMqOptions(options);
  }

  async initialize(_options?: InitOptions): Promise<void> {
    if (this.channel) return;
    if (this.initializePromise) return this.initializePromise;
    this.disposed = false;
    this.initializePromise = retryConnection(
      () => this.connectAndRestore(),
      this.options,
      'RabbitMQ subscriber connection',
    ).finally(() => {
      this.initializePromise = undefined;
    });
    return this.initializePromise;
  }

  async consume(
    topic: string,
    group: string,
    handler: CapHandler,
  ): Promise<void> {
    validateRoutingKey(topic, 'topic');
    queueName(this.options, group);
    const key = subscriptionKey(topic, group);
    if (this.subscriptions.has(key)) return;
    this.subscriptions.set(key, { topic, group, handler });

    try {
      if (!this.channel) await this.initialize();
      const channel = this.channel;
      if (!channel) throw new RabbitMqDisconnectedError('consume');
      const subscription = this.subscriptions.get(key);
      if (!subscription)
        throw new Error(`Missing RabbitMQ subscription ${key}`);
      await this.restoreSubscription(channel, subscription);
    } catch (error) {
      this.subscriptions.delete(key);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.disposed && !this.channel && !this.connection) return;
    this.disposed = true;
    const channel = this.channel;
    const connection = this.connection;
    const consumerTags = [...this.groups.values()]
      .map((group) => group.consumerTag)
      .filter((tag): tag is string => Boolean(tag));
    this.detachChannel();
    this.detachConnection();
    this.channel = undefined;
    this.connection = undefined;
    this.groups.clear();

    if (channel) {
      for (const consumerTag of consumerTags) {
        try {
          await channel.cancel(consumerTag);
        } catch (error) {
          this.options.logger?.warn?.(
            `Failed cancelling RabbitMQ consumer ${consumerTag}`,
            error,
          );
        }
      }
      try {
        await channel.close();
      } catch (error) {
        this.options.logger?.warn?.(
          'Failed closing RabbitMQ subscriber channel',
          error,
        );
      }
    }
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        this.options.logger?.warn?.(
          'Failed closing RabbitMQ subscriber connection',
          error,
        );
      }
    }
  }

  private async connectAndRestore(): Promise<void> {
    const connection = await this.options.connectionFactory(
      this.options.url,
      this.options.socketOptions,
    );
    connection.on('error', this.onConnectionError);
    connection.on('close', this.onConnectionClose);
    try {
      const channel = await connection.createChannel();
      channel.on('error', this.onChannelError);
      channel.on('close', this.onChannelClose);
      await channel.prefetch(this.options.prefetch);
      if (this.options.autoCreateTopology) {
        await channel.assertExchange(
          this.options.exchangeName,
          this.options.exchangeType,
          { durable: this.options.exchangeDurable },
        );
      }
      if (this.disposed) {
        await channel.close();
        await connection.close();
        return;
      }
      this.connection = connection;
      this.channel = channel;
      this.groups.clear();
      for (const subscription of this.subscriptions.values()) {
        await this.restoreSubscription(channel, subscription);
      }
      this.options.logger?.info?.('RabbitMQ subscriber connected');
    } catch (error) {
      connection.removeListener('error', this.onConnectionError);
      connection.removeListener('close', this.onConnectionClose);
      await connection.close().catch(() => undefined);
      throw error;
    }
  }

  private async restoreSubscription(
    channel: RabbitMqConsumerChannel,
    subscription: Subscription,
  ): Promise<void> {
    const queue = queueName(this.options, subscription.group);
    let groupConsumer = this.groups.get(subscription.group);
    if (!groupConsumer) {
      if (this.options.autoCreateTopology) {
        await channel.assertQueue(queue, this.queueOptions());
      }
      groupConsumer = { queue };
      this.groups.set(subscription.group, groupConsumer);
    }
    if (this.options.autoCreateTopology) {
      await channel.bindQueue(
        queue,
        this.options.exchangeName,
        subscription.topic,
      );
    }
    if (!groupConsumer.consumerTag) {
      const reply = await channel.consume(
        queue,
        (message) => {
          void this.dispatchDelivery(subscription.group, message).catch(
            (error) => {
              this.options.logger?.error?.(
                `RabbitMQ delivery boundary rejected for ${subscription.group}`,
                error,
              );
            },
          );
        },
        { noAck: false },
      );
      groupConsumer.consumerTag = reply.consumerTag;
    }
  }

  /** Adapter delivery boundary, exposed for controlled broker harnesses. */
  async dispatchDelivery(
    group: string,
    message: RabbitMqMessage | null,
  ): Promise<void> {
    if (!message) {
      this.options.logger?.error?.(
        `RabbitMQ consumer for ${group} was cancelled by the broker`,
      );
      const channel = this.channel;
      const connection = this.connection;
      this.detachChannel();
      this.detachConnection();
      this.channel = undefined;
      this.connection = undefined;
      this.groups.clear();
      if (channel) await channel.close().catch(() => undefined);
      if (connection) await connection.close().catch(() => undefined);
      this.scheduleRecovery();
      return;
    }
    const channel = this.channel;
    if (!channel) return;
    const topic = message.fields.routingKey;
    const subscription = this.findSubscription(topic, group);
    if (!subscription) {
      this.options.logger?.error?.(
        `RabbitMQ delivery ${topic}|${group} has no matching CAP handler`,
      );
      channel.nack(message, false, false);
      throw new Error(
        `RabbitMQ delivery ${topic}|${group} has no matching CAP handler`,
      );
    }

    try {
      const payload = decodePayload(message);
      const headers = inboundHeaders(message);
      const metadata = inboundMetadata(message, this.options, group);
      await subscription.handler(payload, headers, metadata);
      channel.ack(message);
    } catch (error) {
      const malformed = error instanceof RabbitMqMalformedMessageError;
      const requeue = malformed ? false : this.options.requeueOnHandlerError;
      channel.nack(message, false, requeue);
      this.options.logger?.error?.(
        malformed
          ? `Rejected malformed RabbitMQ message ${topic}|${group}`
          : `RabbitMQ CAP handler rejected ${topic}|${group}; requeue=${requeue}`,
        error,
      );
      throw error;
    }
  }

  private findSubscription(
    topic: string,
    group: string,
  ): Subscription | undefined {
    return [...this.subscriptions.values()].find(
      (subscription) =>
        subscription.group === group && topicMatches(subscription.topic, topic),
    );
  }

  private queueOptions(): RabbitMqQueueOptions {
    const args: Record<string, unknown> = {};
    if (this.options.queueType === 'quorum') args['x-queue-type'] = 'quorum';
    if (this.options.deadLetterExchange) {
      args['x-dead-letter-exchange'] = this.options.deadLetterExchange;
    }
    if (this.options.deadLetterRoutingKey) {
      args['x-dead-letter-routing-key'] = this.options.deadLetterRoutingKey;
    }
    return {
      durable: true,
      exclusive: false,
      autoDelete: false,
      arguments: args,
    };
  }

  private scheduleRecovery(): void {
    if (this.disposed || this.recoveryPromise) return;
    this.recoveryPromise = retryConnection(
      () => this.connectAndRestore(),
      this.options,
      'RabbitMQ subscriber recovery',
    )
      .catch((error) => {
        this.options.logger?.error?.(
          'RabbitMQ subscriber recovery stopped after bounded retries',
          error,
        );
      })
      .finally(() => {
        this.recoveryPromise = undefined;
      });
  }

  private detachConnection(): void {
    this.connection?.removeListener('error', this.onConnectionError);
    this.connection?.removeListener('close', this.onConnectionClose);
  }

  private detachChannel(): void {
    this.channel?.removeListener('error', this.onChannelError);
    this.channel?.removeListener('close', this.onChannelClose);
  }
}

function subscriptionKey(topic: string, group: string): string {
  return `${topic}|${group}`;
}

function decodePayload(message: RabbitMqMessage): unknown {
  if (message.properties.contentType !== 'application/json') {
    throw new RabbitMqMalformedMessageError(
      `Expected application/json but received ${message.properties.contentType ?? 'no content type'}`,
    );
  }
  try {
    return JSON.parse(message.content.toString('utf8')) as unknown;
  } catch (error) {
    throw new RabbitMqMalformedMessageError(
      `RabbitMQ message contains invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function inboundHeaders(message: RabbitMqMessage): CapHeaders | undefined {
  const raw: unknown = message.properties.headers;
  const entries = isRecord(raw) ? Object.entries(raw) : [];
  const headers: CapHeaders = {};
  for (const [key, value] of entries) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      headers[key] = value;
    }
  }
  const rawCorrelationId: unknown = message.properties.correlationId;
  const correlationId = normalizeIdentifier(rawCorrelationId);
  if (correlationId !== undefined && headers['correlation-id'] === undefined) {
    headers['correlation-id'] = correlationId;
  }
  if (message.fields.redelivered) {
    headers['x-cap-rabbitmq-redelivered'] = true;
  }
  return Object.keys(headers).length ? headers : undefined;
}

function inboundMetadata(
  message: RabbitMqMessage,
  options: ResolvedRabbitMqOptions,
  group: string,
): SubscribeMetadata {
  const rawMessageId: unknown = message.properties.messageId;
  const messageId = normalizeIdentifier(rawMessageId);
  return {
    messageId,
    dedupeKey: messageId
      ? `${options.exchangeName}/${queueName(options, group)}|${messageId}`
      : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeIdentifier(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function topicMatches(pattern: string, topic: string): boolean {
  const patternParts = pattern.split('.');
  const topicParts = topic.split('.');
  const match = (patternIndex: number, topicIndex: number): boolean => {
    if (patternIndex === patternParts.length) {
      return topicIndex === topicParts.length;
    }
    const part = patternParts[patternIndex];
    if (part === '#') {
      for (let index = topicIndex; index <= topicParts.length; index += 1) {
        if (match(patternIndex + 1, index)) return true;
      }
      return false;
    }
    if (topicIndex === topicParts.length) return false;
    if (part !== '*' && part !== topicParts[topicIndex]) return false;
    return match(patternIndex + 1, topicIndex + 1);
  };
  return match(0, 0);
}
