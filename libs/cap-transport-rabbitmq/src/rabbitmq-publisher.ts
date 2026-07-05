import type {
  CapHeaders,
  PublishMetadata,
  PublisherPort,
} from '@mikara89/cap-core';
import type { InitOptions } from '@mikara89/cap-core';
import {
  RabbitMqConfirmTimeoutError,
  RabbitMqDisconnectedError,
} from './rabbitmq-errors';
import { resolveRabbitMqOptions, validateRoutingKey } from './rabbitmq-config';
import type {
  RabbitMqOptions,
  ResolvedRabbitMqOptions,
} from './rabbitmq-options';
import {
  isRabbitMqRetryCancelled,
  reportConnectionError,
  retryConnection,
} from './rabbitmq-retry';
import type {
  RabbitMqConfirmChannel,
  RabbitMqConnection,
  RabbitMqPublishOptions,
} from './rabbitmq-types';

export class RabbitMqPublisher implements PublisherPort {
  private readonly options: ResolvedRabbitMqOptions;
  private connection?: RabbitMqConnection;
  private channel?: RabbitMqConfirmChannel;
  private initializePromise?: Promise<void>;
  private recoveryPromise?: Promise<void>;
  private disposed = false;

  private readonly onConnectionError = (error: unknown): void => {
    reportConnectionError(this.options.logger, 'Publisher', error);
  };

  private readonly onConnectionClose = (): void => {
    this.options.logger?.warn?.('RabbitMQ publisher connection closed');
    const channel = this.channel;
    this.detachConnection();
    this.detachChannel();
    this.channel = undefined;
    this.connection = undefined;
    if (channel) void channel.close().catch(() => undefined);
    this.scheduleRecovery();
  };

  private readonly onChannelError = (error: unknown): void => {
    this.options.logger?.error?.('RabbitMQ publisher channel error', error);
  };

  private readonly onChannelClose = (): void => {
    this.options.logger?.warn?.('RabbitMQ publisher channel closed');
    const connection = this.connection;
    this.detachChannel();
    this.detachConnection();
    this.channel = undefined;
    this.connection = undefined;
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
      () => this.connect(),
      this.options,
      'RabbitMQ publisher connection',
    ).finally(() => {
      this.initializePromise = undefined;
    });
    return this.initializePromise;
  }

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void> {
    validateRoutingKey(topic, 'topic');
    const channel = this.channel;
    if (!channel) throw new RabbitMqDisconnectedError('publish');

    const content = encodePayload(payload);
    const publishOptions: RabbitMqPublishOptions = {
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      deliveryMode: 2,
      persistent: true,
      messageId: metadata?.messageId,
      correlationId: correlationId(headers),
      type: topic,
      timestamp: Date.now(),
      headers,
      mandatory: false,
    };

    await this.publishConfirmed(channel, topic, content, publishOptions);
    this.options.logger?.debug?.(
      `RabbitMQ broker confirmed publish to ${this.options.exchangeName}:${topic}`,
    );
  }

  async close(): Promise<void> {
    if (this.disposed && !this.channel && !this.connection) return;
    this.disposed = true;
    const channel = this.channel;
    const connection = this.connection;
    this.detachChannel();
    this.detachConnection();
    this.channel = undefined;
    this.connection = undefined;

    if (channel) {
      try {
        await channel.close();
      } catch (error) {
        this.options.logger?.warn?.(
          'Failed closing RabbitMQ publisher channel',
          error,
        );
      }
    }
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        this.options.logger?.warn?.(
          'Failed closing RabbitMQ publisher connection',
          error,
        );
      }
    }
  }

  private async connect(): Promise<void> {
    const connection = await this.options.connectionFactory(
      this.options.url,
      this.options.socketOptions,
    );
    connection.on('error', this.onConnectionError);
    connection.on('close', this.onConnectionClose);

    try {
      const channel = await connection.createConfirmChannel();
      channel.on('error', this.onChannelError);
      channel.on('close', this.onChannelClose);
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
      this.options.logger?.info?.('RabbitMQ publisher connected');
    } catch (error) {
      connection.removeListener('error', this.onConnectionError);
      connection.removeListener('close', this.onConnectionClose);
      await connection.close().catch(() => undefined);
      throw error;
    }
  }

  private publishConfirmed(
    channel: RabbitMqConfirmChannel,
    topic: string,
    content: Buffer,
    publishOptions: RabbitMqPublishOptions,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let confirmed = false;
      let drained = true;
      let settled = false;

      const cleanup = (): void => {
        clearTimeout(timer);
        channel.removeListener('drain', onDrain);
        channel.removeListener('close', onClose);
      };
      const succeedIfReady = (): void => {
        if (confirmed && drained && !settled) {
          settled = true;
          cleanup();
          resolve();
        }
      };
      const fail = (error: Error): void => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };
      const onDrain = (): void => {
        drained = true;
        succeedIfReady();
      };
      const onClose = (): void => {
        fail(new RabbitMqDisconnectedError('in-flight publish confirmation'));
      };
      const timer = setTimeout(
        () =>
          fail(new RabbitMqConfirmTimeoutError(this.options.confirmTimeoutMs)),
        this.options.confirmTimeoutMs,
      );

      try {
        channel.once('close', onClose);
        drained = channel.publish(
          this.options.exchangeName,
          topic,
          content,
          publishOptions,
          (error: Error | null) => {
            if (error) {
              fail(error);
              return;
            }
            confirmed = true;
            succeedIfReady();
          },
        );
        if (!drained) channel.once('drain', onDrain);
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private scheduleRecovery(): void {
    if (this.disposed || this.recoveryPromise) return;
    this.recoveryPromise = retryConnection(
      () => this.connect(),
      this.options,
      'RabbitMQ publisher recovery',
      () => this.disposed,
    )
      .catch((error) => {
        if (isRabbitMqRetryCancelled(error)) return;
        this.options.logger?.error?.(
          'RabbitMQ publisher recovery stopped after bounded retries',
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

function encodePayload(payload: unknown): Buffer {
  const encoded = JSON.stringify(payload);
  if (encoded === undefined) {
    throw new TypeError('RabbitMQ payload must be JSON-serializable');
  }
  return Buffer.from(encoded, 'utf8');
}

function correlationId(headers?: CapHeaders): string | undefined {
  const value = headers?.['correlation-id'];
  return value === undefined ? undefined : String(value);
}
