import { EventEmitter } from 'node:events';
import type { CapHeaders } from '@mikara89/cap-core';
import type {
  RabbitMqConfirmChannel,
  RabbitMqConnection,
  RabbitMqConsumerChannel,
  RabbitMqMessage,
  RabbitMqPublishOptions,
  RabbitMqQueueOptions,
} from '../src';

export interface FakePublishedMessage {
  exchange: string;
  topic: string;
  payload: unknown;
  options: RabbitMqPublishOptions;
}

export class FakeBroker {
  readonly published: FakePublishedMessage[] = [];
  readonly confirmChannels = new Set<FakeConfirmChannel>();
  readonly consumerChannels = new Set<FakeConsumerChannel>();
  confirmChannelsCreated = 0;
  consumerChannelsCreated = 0;
  failNextPublish?: Error;
  suppressConfirm = false;
  backpressure = false;

  connection(): FakeConnection {
    return new FakeConnection(this);
  }

  message(
    topic: string,
    payload: unknown,
    options: {
      headers?: CapHeaders;
      messageId?: string;
      correlationId?: string;
      redelivered?: boolean;
      contentType?: string;
      rawContent?: Buffer;
    } = {},
  ): RabbitMqMessage {
    return {
      content:
        options.rawContent ?? Buffer.from(JSON.stringify(payload), 'utf8'),
      fields: {
        consumerTag: 'fake-consumer',
        deliveryTag: 1,
        redelivered: options.redelivered ?? false,
        exchange: 'cap',
        routingKey: topic,
      },
      properties: {
        contentType: options.contentType ?? 'application/json',
        contentEncoding: 'utf-8',
        headers: options.headers ?? {},
        deliveryMode: 2,
        priority: undefined,
        correlationId: options.correlationId,
        replyTo: undefined,
        expiration: undefined,
        messageId: options.messageId,
        timestamp: Date.now(),
        type: topic,
        userId: undefined,
        appId: undefined,
        clusterId: undefined,
      },
    };
  }
}

export class FakeConnection extends EventEmitter implements RabbitMqConnection {
  closed = false;

  constructor(private readonly broker: FakeBroker) {
    super();
  }

  createConfirmChannel(): Promise<RabbitMqConfirmChannel> {
    const channel = new FakeConfirmChannel(this.broker);
    this.broker.confirmChannelsCreated += 1;
    this.broker.confirmChannels.add(channel);
    return Promise.resolve(channel);
  }

  createChannel(): Promise<RabbitMqConsumerChannel> {
    const channel = new FakeConsumerChannel(this.broker);
    this.broker.consumerChannelsCreated += 1;
    this.broker.consumerChannels.add(channel);
    return Promise.resolve(channel);
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  triggerClose(): void {
    this.emit('close');
  }
}

export class FakeConfirmChannel
  extends EventEmitter
  implements RabbitMqConfirmChannel
{
  readonly assertExchange = jest.fn().mockResolvedValue({ exchange: 'cap' });
  closed = false;

  constructor(private readonly broker: FakeBroker) {
    super();
  }

  publish(
    exchange: string,
    topic: string,
    content: Buffer,
    options: RabbitMqPublishOptions,
    callback: (error: Error | null, ok?: unknown) => void,
  ): boolean {
    this.broker.published.push({
      exchange,
      topic,
      payload: JSON.parse(content.toString('utf8')) as unknown,
      options,
    });
    if (!this.broker.suppressConfirm) {
      const error = this.broker.failNextPublish;
      this.broker.failNextPublish = undefined;
      queueMicrotask(() => callback(error ?? null));
    }
    return !this.broker.backpressure;
  }

  close(): Promise<void> {
    this.closed = true;
    this.broker.confirmChannels.delete(this);
    return Promise.resolve();
  }
}

export class FakeConsumerChannel
  extends EventEmitter
  implements RabbitMqConsumerChannel
{
  readonly assertExchange = jest.fn().mockResolvedValue({ exchange: 'cap' });
  readonly assertQueue = jest
    .fn()
    .mockImplementation((queue: string, _options?: RabbitMqQueueOptions) =>
      Promise.resolve({ queue, messageCount: 0, consumerCount: 0 }),
    );
  readonly bindQueue = jest.fn().mockResolvedValue({});
  readonly prefetch = jest.fn().mockResolvedValue({});
  readonly ack = jest.fn();
  readonly nack = jest.fn();
  readonly cancel = jest.fn().mockResolvedValue({ consumerTag: 'cancelled' });
  readonly consumers = new Map<
    string,
    (message: RabbitMqMessage | null) => void
  >();
  closed = false;
  private nextConsumer = 1;

  constructor(private readonly broker: FakeBroker) {
    super();
  }

  consume(
    queue: string,
    callback: (message: RabbitMqMessage | null) => void,
  ): Promise<{ consumerTag: string }> {
    const consumerTag = `consumer-${this.nextConsumer++}`;
    this.consumers.set(queue, callback);
    return Promise.resolve({ consumerTag });
  }

  close(): Promise<void> {
    this.closed = true;
    this.broker.consumerChannels.delete(this);
    return Promise.resolve();
  }
}
