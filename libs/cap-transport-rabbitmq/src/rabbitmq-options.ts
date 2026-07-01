import type { Options } from 'amqplib';
import type { CapLogger } from '@mikara89/cap-core';
import type { RabbitMqConnection } from './rabbitmq-types';

export type RabbitMqQueueType = 'classic' | 'quorum';

export type RabbitMqConnectionFactory = (
  url: string,
  socketOptions?: Options.Connect,
) => Promise<RabbitMqConnection>;

export interface RabbitMqRetryOptions {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface RabbitMqOptions {
  url?: string;
  socketOptions?: Options.Connect;
  connectionFactory?: RabbitMqConnectionFactory;
  exchangeName?: string;
  exchangeType?: 'topic';
  exchangeDurable?: boolean;
  namingPrefix?: string;
  queuePrefix?: string;
  queueType?: RabbitMqQueueType;
  prefetch?: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  autoCreateTopology?: boolean;
  confirmTimeoutMs?: number;
  reconnect?: RabbitMqRetryOptions;
  requeueOnHandlerError?: boolean;
  logger?: CapLogger;
}

export interface ResolvedRabbitMqOptions {
  url: string;
  socketOptions?: Options.Connect;
  connectionFactory: RabbitMqConnectionFactory;
  exchangeName: string;
  exchangeType: 'topic';
  exchangeDurable: boolean;
  queuePrefix: string;
  queueType: RabbitMqQueueType;
  prefetch: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  autoCreateTopology: boolean;
  confirmTimeoutMs: number;
  reconnect: Required<RabbitMqRetryOptions>;
  requeueOnHandlerError: boolean;
  logger?: CapLogger;
}
