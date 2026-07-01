import { connect } from 'amqplib';
import type { Options } from 'amqplib';
import type {
  RabbitMqOptions,
  ResolvedRabbitMqOptions,
} from './rabbitmq-options';
import type { RabbitMqConnection } from './rabbitmq-types';

const MAX_AMQP_NAME_BYTES = 255;

export function resolveRabbitMqOptions(
  options: RabbitMqOptions,
): ResolvedRabbitMqOptions {
  const namingPrefix = options.namingPrefix ?? '';
  const exchangeName = `${namingPrefix}${options.exchangeName ?? 'cap'}`;
  const queuePrefix = `${namingPrefix}${options.queuePrefix ?? 'cap.'}`;
  validateName(exchangeName, 'exchange name');
  validatePrefix(queuePrefix, 'queue prefix');

  if (options.exchangeType && options.exchangeType !== 'topic') {
    throw new Error('RabbitMQ CAP transport requires a topic exchange');
  }
  if (options.prefetch !== undefined && !isPositiveInteger(options.prefetch)) {
    throw new Error('RabbitMQ prefetch must be a positive integer');
  }
  if (
    options.confirmTimeoutMs !== undefined &&
    !isPositiveInteger(options.confirmTimeoutMs)
  ) {
    throw new Error('RabbitMQ confirmTimeoutMs must be a positive integer');
  }
  if (options.deadLetterRoutingKey && !options.deadLetterExchange) {
    throw new Error(
      'RabbitMQ deadLetterRoutingKey requires deadLetterExchange',
    );
  }
  if (options.deadLetterExchange) {
    validateName(options.deadLetterExchange, 'dead-letter exchange name');
  }

  const reconnect = {
    attempts: options.reconnect?.attempts ?? 5,
    initialDelayMs: options.reconnect?.initialDelayMs ?? 100,
    maxDelayMs: options.reconnect?.maxDelayMs ?? 5_000,
  };
  if (!isPositiveInteger(reconnect.attempts)) {
    throw new Error('RabbitMQ reconnect attempts must be a positive integer');
  }
  if (!isNonNegativeInteger(reconnect.initialDelayMs)) {
    throw new Error(
      'RabbitMQ reconnect initialDelayMs must be a non-negative integer',
    );
  }
  if (!isNonNegativeInteger(reconnect.maxDelayMs)) {
    throw new Error(
      'RabbitMQ reconnect maxDelayMs must be a non-negative integer',
    );
  }
  if (reconnect.maxDelayMs < reconnect.initialDelayMs) {
    throw new Error(
      'RabbitMQ reconnect maxDelayMs must be at least initialDelayMs',
    );
  }

  return {
    url: options.url ?? 'amqp://localhost',
    socketOptions: options.socketOptions,
    connectionFactory: options.connectionFactory ?? defaultConnectionFactory,
    exchangeName,
    exchangeType: 'topic',
    exchangeDurable: options.exchangeDurable ?? true,
    queuePrefix,
    queueType: options.queueType ?? 'classic',
    prefetch: options.prefetch ?? 1,
    deadLetterExchange: options.deadLetterExchange,
    deadLetterRoutingKey: options.deadLetterRoutingKey,
    autoCreateTopology: options.autoCreateTopology ?? true,
    confirmTimeoutMs: options.confirmTimeoutMs ?? 10_000,
    reconnect,
    requeueOnHandlerError: options.requeueOnHandlerError ?? false,
    logger: options.logger,
  };
}

export function validateRoutingKey(value: string, label = 'routing key'): void {
  validateName(value, label);
}

export function queueName(
  options: ResolvedRabbitMqOptions,
  group: string,
): string {
  validateName(group, 'consumer group');
  const value = `${options.queuePrefix}${group}`;
  validateName(value, 'generated queue name');
  if (value.startsWith('amq.')) {
    throw new Error('Generated RabbitMQ queue names must not use amq.*');
  }
  return value;
}

function validatePrefix(value: string, label: string): void {
  if (/\p{Cc}/u.test(value)) throw new Error(`RabbitMQ ${label} is invalid`);
  if (Buffer.byteLength(value) >= MAX_AMQP_NAME_BYTES) {
    throw new Error(`RabbitMQ ${label} is too long`);
  }
}

function validateName(value: string, label: string): void {
  if (value.length === 0 || value.trim() !== value || /\p{Cc}/u.test(value)) {
    throw new Error(`RabbitMQ ${label} is invalid`);
  }
  if (Buffer.byteLength(value) > MAX_AMQP_NAME_BYTES) {
    throw new Error(`RabbitMQ ${label} is too long`);
  }
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function defaultConnectionFactory(
  url: string,
  socketOptions?: Options.Connect,
): Promise<RabbitMqConnection> {
  return connect(url, socketOptions);
}
