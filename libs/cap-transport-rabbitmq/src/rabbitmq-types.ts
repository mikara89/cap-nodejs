import type { ConsumeMessage, Options, Replies } from 'amqplib';

interface RabbitMqEventSource {
  on(event: string, listener: (...args: unknown[]) => void): this;
  once(event: string, listener: (...args: unknown[]) => void): this;
  removeListener(event: string, listener: (...args: unknown[]) => void): this;
}

export interface RabbitMqConfirmChannel extends RabbitMqEventSource {
  assertExchange(
    exchange: string,
    type: string,
    options?: Options.AssertExchange,
  ): Promise<Replies.AssertExchange>;
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options: Options.Publish,
    callback: (error: Error | null, ok?: unknown) => void,
  ): boolean;
  close(): Promise<void>;
}

export interface RabbitMqConsumerChannel extends RabbitMqEventSource {
  assertExchange(
    exchange: string,
    type: string,
    options?: Options.AssertExchange,
  ): Promise<Replies.AssertExchange>;
  assertQueue(
    queue: string,
    options?: Options.AssertQueue,
  ): Promise<Replies.AssertQueue>;
  bindQueue(
    queue: string,
    source: string,
    pattern: string,
    args?: unknown,
  ): Promise<Replies.Empty>;
  prefetch(count: number, global?: boolean): Promise<Replies.Empty>;
  consume(
    queue: string,
    callback: (message: ConsumeMessage | null) => void,
    options?: Options.Consume,
  ): Promise<Replies.Consume>;
  cancel(consumerTag: string): Promise<Replies.Empty>;
  ack(message: ConsumeMessage, allUpTo?: boolean): void;
  nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
  close(): Promise<void>;
}

export interface RabbitMqConnection {
  createChannel(): Promise<RabbitMqConsumerChannel>;
  createConfirmChannel(): Promise<RabbitMqConfirmChannel>;
  close(): Promise<void>;
  on(event: string, listener: (...args: unknown[]) => void): this;
  removeListener(event: string, listener: (...args: unknown[]) => void): this;
}

export type RabbitMqMessage = ConsumeMessage;
export type RabbitMqPublishOptions = Options.Publish;
export type RabbitMqQueueOptions = Options.AssertQueue;
export type RabbitMqConsumeReply = Replies.Consume;
