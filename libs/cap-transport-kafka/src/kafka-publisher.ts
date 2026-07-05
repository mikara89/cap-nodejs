import type {
  CapHeaders,
  InitOptions,
  PublisherPort,
  PublishMetadata,
} from '@mikara89/cap-core';
import {
  kafkaClientConfig,
  kafkaTopic,
  resolveKafkaOptions,
} from './kafka-config';
import {
  KafkaDisconnectedError,
  KafkaPublishTimeoutError,
} from './kafka-errors';
import type { KafkaOptions, ResolvedKafkaOptions } from './kafka-options';
import { KafkaTopicManager } from './kafka-topics';
import type {
  IHeaders,
  KafkaClientFactory,
  KafkaProducerClient,
} from './kafka-types';

const CONTENT_TYPE = 'content-type';
const MESSAGE_ID = 'cap-message-id';

export class KafkaPublisher implements PublisherPort {
  private readonly options: ResolvedKafkaOptions;
  private readonly client: KafkaClientFactory;
  private readonly topics: KafkaTopicManager;
  private producer?: KafkaProducerClient;
  private initializing?: Promise<void>;

  constructor(options: KafkaOptions = {}) {
    this.options = resolveKafkaOptions(options);
    this.client = this.options.factory(kafkaClientConfig(this.options));
    this.topics = new KafkaTopicManager(this.client, this.options);
  }

  async initialize(_options?: InitOptions): Promise<void> {
    if (this.producer) return;
    if (this.initializing) return this.initializing;
    const producer = this.client.producer({
      ...this.options.producer,
      allowAutoTopicCreation: false,
    });
    this.initializing = producer
      .connect()
      .then(() => {
        this.producer = producer;
      })
      .catch(async (error) => {
        await producer.disconnect().catch(() => undefined);
        throw error;
      })
      .finally(() => {
        this.initializing = undefined;
      });
    return this.initializing;
  }

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: PublishMetadata,
  ): Promise<void> {
    const producer = this.producer;
    if (!producer) throw new KafkaDisconnectedError('publish');
    const resolvedTopic = kafkaTopic(this.options, topic);
    const encoded = JSON.stringify(payload);
    if (encoded === undefined)
      throw new TypeError('Kafka payload must be JSON-serializable');
    await this.topics.ensure(resolvedTopic);
    await withTimeout(
      producer.send({
        topic: resolvedTopic,
        messages: [
          {
            value: Buffer.from(encoded, 'utf8'),
            headers: encodeHeaders(headers, metadata?.messageId),
          },
        ],
      }),
      this.options.publishTimeoutMs,
    );
  }

  async close(): Promise<void> {
    const producer = this.producer;
    this.producer = undefined;
    if (producer) await producer.disconnect();
  }
}

function encodeHeaders(headers?: CapHeaders, messageId?: string): IHeaders {
  const encoded: IHeaders = { [CONTENT_TYPE]: 'application/json' };
  for (const [name, value] of Object.entries(headers ?? {})) {
    encoded[name] = JSON.stringify(
      value instanceof Date ? value.toISOString() : value,
    );
  }
  if (messageId) encoded[MESSAGE_ID] = messageId;
  return encoded;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new KafkaPublishTimeoutError(timeoutMs)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
