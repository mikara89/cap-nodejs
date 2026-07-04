import type {
  ConsumerConfig,
  EachMessagePayload,
  IHeaders,
  KafkaConfig,
  ProducerConfig,
  RecordMetadata,
  SASLOptions,
} from '@confluentinc/kafka-javascript/types/kafkajs';

export type {
  ConsumerConfig,
  EachMessagePayload,
  IHeaders,
  KafkaConfig,
  ProducerConfig,
  SASLOptions,
};

export interface KafkaProducerClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(record: {
    topic: string;
    messages: Array<{ value: Buffer; headers?: IHeaders }>;
  }): Promise<RecordMetadata[]>;
}

export interface KafkaConsumerClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  stop(): Promise<void>;
  subscribe(options: { topics: string[]; replace?: boolean }): Promise<void>;
  run(options: {
    eachMessage: (payload: EachMessagePayload) => Promise<void>;
  }): Promise<void>;
  commitOffsets(
    offsets: Array<{ topic: string; partition: number; offset: string }>,
  ): Promise<void>;
}

export interface KafkaAdminClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createTopics(options: {
    topics: Array<{
      topic: string;
      numPartitions?: number;
      replicationFactor?: number;
      configEntries?: Array<{ name: string; value: string }>;
    }>;
  }): Promise<boolean>;
}

export interface KafkaClientFactory {
  producer(config: ProducerConfig): KafkaProducerClient;
  consumer(config: ConsumerConfig): KafkaConsumerClient;
  admin(): KafkaAdminClient;
}

export type KafkaFactory = (config: KafkaConfig) => KafkaClientFactory;
