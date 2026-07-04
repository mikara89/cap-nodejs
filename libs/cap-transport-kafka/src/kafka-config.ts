import { KafkaJS } from '@confluentinc/kafka-javascript';
import type { KafkaOptions, ResolvedKafkaOptions } from './kafka-options';
import type { KafkaClientFactory, KafkaFactory } from './kafka-types';
import type { KafkaConfig } from './kafka-types';

export function resolveKafkaOptions(
  options: KafkaOptions,
): ResolvedKafkaOptions {
  const brokers = options.brokers ?? ['localhost:9092'];
  if (brokers.length === 0 || brokers.some((broker) => !broker.trim())) {
    throw new Error('Kafka brokers must contain at least one non-empty broker');
  }
  if (!options.clientId?.trim() && options.clientId !== undefined) {
    throw new Error('Kafka clientId must not be empty');
  }
  if (/\p{Cc}/u.test(options.topicPrefix ?? '')) {
    throw new Error('Kafka topicPrefix is invalid');
  }
  const publishTimeoutMs = options.publishTimeoutMs ?? 30_000;
  if (!Number.isInteger(publishTimeoutMs) || publishTimeoutMs <= 0) {
    throw new Error('Kafka publishTimeoutMs must be a positive integer');
  }
  const partitions = options.topicCreation?.partitions ?? 1;
  const replicationFactor = options.topicCreation?.replicationFactor ?? 1;
  if (!Number.isInteger(partitions) || partitions <= 0) {
    throw new Error('Kafka topic partitions must be a positive integer');
  }
  if (!Number.isInteger(replicationFactor) || replicationFactor <= 0) {
    throw new Error('Kafka topic replicationFactor must be a positive integer');
  }
  return {
    clientId: options.clientId ?? 'cap-nodejs',
    brokers: [...brokers],
    ssl: options.ssl,
    sasl: options.sasl,
    topicPrefix: options.topicPrefix ?? '',
    producer: { acks: -1, ...options.producer },
    consumer: { fromBeginning: true, ...options.consumer },
    autoCreateTopics: options.autoCreateTopics ?? false,
    topicCreation: {
      partitions,
      replicationFactor,
      config: options.topicCreation?.config,
    },
    publishTimeoutMs,
    factory: options.factory ?? defaultKafkaFactory,
    logger: options.logger,
  };
}

export function kafkaTopic(
  options: ResolvedKafkaOptions,
  topic: string,
): string {
  if (topic.length === 0 || topic.trim() !== topic || /\p{Cc}/u.test(topic)) {
    throw new Error('Kafka topic is invalid');
  }
  const resolved = `${options.topicPrefix}${topic}`;
  if (Buffer.byteLength(resolved) > 249)
    throw new Error('Kafka topic is too long');
  return resolved;
}

export function validateKafkaGroup(group: string): void {
  if (group.length === 0 || group.trim() !== group || /\p{Cc}/u.test(group)) {
    throw new Error('Kafka consumer group is invalid');
  }
}

export function kafkaClientConfig(options: ResolvedKafkaOptions): KafkaConfig {
  const config: KafkaConfig = {
    clientId: options.clientId,
    brokers: options.brokers,
  };
  if (options.ssl !== undefined) config.ssl = options.ssl;
  if (options.sasl !== undefined) config.sasl = options.sasl;
  return config;
}

function defaultKafkaFactory(
  config: Parameters<KafkaFactory>[0],
): KafkaClientFactory {
  const kafka = new KafkaJS.Kafka({ kafkaJS: config });
  return {
    producer: (producerConfig) => kafka.producer({ kafkaJS: producerConfig }),
    consumer: (consumerConfig) => kafka.consumer({ kafkaJS: consumerConfig }),
    admin: () => kafka.admin(),
  };
}
