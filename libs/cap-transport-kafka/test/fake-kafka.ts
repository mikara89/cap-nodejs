import type {
  ConsumerConfig,
  EachMessagePayload,
  IHeaders,
  KafkaAdminClient,
  KafkaClientFactory,
  KafkaConsumerClient,
  KafkaConfig,
  KafkaFactory,
  KafkaProducerClient,
  ProducerConfig,
} from '../src';

export interface FakePublishedMessage {
  topic: string;
  value: Buffer;
  headers?: IHeaders;
}

export class FakeKafkaBroker implements KafkaClientFactory {
  readonly published: FakePublishedMessage[] = [];
  readonly consumers = new Set<FakeKafkaConsumer>();
  readonly createdTopics: unknown[] = [];
  producerConnected = 0;
  failNextPublish?: Error;
  pendingPublish?: Promise<never>;
  producerConfig?: ProducerConfig;
  consumerConfigs: ConsumerConfig[] = [];
  clientConfigs: KafkaConfig[] = [];

  readonly factory: KafkaFactory = (config) => {
    this.clientConfigs.push(config);
    return this;
  };

  producer(config: ProducerConfig): KafkaProducerClient {
    this.producerConfig = config;
    let connected = false;
    return {
      connect: () => {
        connected = true;
        this.producerConnected += 1;
        return Promise.resolve();
      },
      disconnect: () => {
        if (connected) this.producerConnected -= 1;
        connected = false;
        return Promise.resolve();
      },
      send: async (record) => {
        if (this.failNextPublish) {
          const error = this.failNextPublish;
          this.failNextPublish = undefined;
          throw error;
        }
        if (this.pendingPublish) return this.pendingPublish;
        this.published.push(
          ...record.messages.map((message) => ({
            topic: record.topic,
            value: message.value,
            headers: message.headers,
          })),
        );
        return [];
      },
    };
  }

  consumer(config: ConsumerConfig): KafkaConsumerClient {
    this.consumerConfigs.push(config);
    const consumer = new FakeKafkaConsumer(config.groupId, this);
    this.consumers.add(consumer);
    return consumer;
  }

  admin(): KafkaAdminClient {
    return {
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      createTopics: (options) => {
        this.createdTopics.push(options);
        return Promise.resolve(true);
      },
    };
  }

  async deliver(
    group: string,
    topic: string,
    value: Buffer,
    headers?: IHeaders,
    offset = '0',
  ): Promise<void> {
    const consumer = [...this.consumers].find(
      (item) => item.group === group && item.topics.has(topic),
    );
    if (!consumer?.eachMessage)
      throw new Error(`No fake Kafka consumer for ${topic}|${group}`);
    await consumer.eachMessage({
      topic,
      partition: 0,
      message: {
        key: null,
        value,
        timestamp: String(Date.now()),
        attributes: 0,
        offset,
        headers: headers ?? {},
      },
      heartbeat: () => Promise.resolve(),
      pause: () => () => undefined,
    });
  }
}

export class FakeKafkaConsumer implements KafkaConsumerClient {
  readonly topics = new Set<string>();
  readonly commits: Array<{
    topic: string;
    partition: number;
    offset: string;
  }> = [];
  eachMessage?: (payload: EachMessagePayload) => Promise<void>;
  connected = false;

  constructor(
    readonly group: string,
    private readonly broker: FakeKafkaBroker,
  ) {}

  connect(): Promise<void> {
    this.connected = true;
    return Promise.resolve();
  }
  disconnect(): Promise<void> {
    this.connected = false;
    this.broker.consumers.delete(this);
    return Promise.resolve();
  }
  stop(): Promise<void> {
    this.eachMessage = undefined;
    return Promise.resolve();
  }
  subscribe(options: { topics: string[] }): Promise<void> {
    options.topics.forEach((topic) => this.topics.add(topic));
    return Promise.resolve();
  }
  run(options: {
    eachMessage: (payload: EachMessagePayload) => Promise<void>;
  }): Promise<void> {
    this.eachMessage = options.eachMessage;
    return Promise.resolve();
  }
  commitOffsets(
    offsets: Array<{ topic: string; partition: number; offset: string }>,
  ): Promise<void> {
    this.commits.push(...offsets);
    return Promise.resolve();
  }
}
