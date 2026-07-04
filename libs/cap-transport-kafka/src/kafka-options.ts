import type { CapLogger } from '@mikara89/cap-core';
import type {
  ConsumerConfig,
  KafkaFactory,
  ProducerConfig,
  SASLOptions,
} from './kafka-types';

export interface KafkaTopicCreationOptions {
  partitions?: number;
  replicationFactor?: number;
  config?: Record<string, string>;
}

export interface KafkaOptions {
  clientId?: string;
  brokers?: string[];
  ssl?: boolean;
  sasl?: SASLOptions;
  topicPrefix?: string;
  producer?: Omit<ProducerConfig, 'allowAutoTopicCreation'>;
  consumer?: Omit<
    ConsumerConfig,
    'groupId' | 'autoCommit' | 'allowAutoTopicCreation'
  >;
  autoCreateTopics?: boolean;
  topicCreation?: KafkaTopicCreationOptions;
  publishTimeoutMs?: number;
  factory?: KafkaFactory;
  logger?: CapLogger;
}

export interface ResolvedKafkaOptions {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: SASLOptions;
  topicPrefix: string;
  producer: Omit<ProducerConfig, 'allowAutoTopicCreation'>;
  consumer: Omit<
    ConsumerConfig,
    'groupId' | 'autoCommit' | 'allowAutoTopicCreation'
  >;
  autoCreateTopics: boolean;
  topicCreation: Required<
    Pick<KafkaTopicCreationOptions, 'partitions' | 'replicationFactor'>
  > &
    Pick<KafkaTopicCreationOptions, 'config'>;
  publishTimeoutMs: number;
  factory: KafkaFactory;
  logger?: CapLogger;
}
