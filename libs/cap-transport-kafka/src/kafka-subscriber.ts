import type {
  CapHandler,
  CapHeaders,
  InitOptions,
  SubscriberPort,
  SubscribeMetadata,
} from '@mikara89/cap-core';
import {
  kafkaClientConfig,
  kafkaTopic,
  resolveKafkaOptions,
  validateKafkaGroup,
} from './kafka-config';
import { KafkaMalformedMessageError } from './kafka-errors';
import type { KafkaOptions, ResolvedKafkaOptions } from './kafka-options';
import { KafkaTopicManager } from './kafka-topics';
import type {
  EachMessagePayload,
  IHeaders,
  KafkaClientFactory,
  KafkaConsumerClient,
} from './kafka-types';

const CONTENT_TYPE = 'content-type';
const MESSAGE_ID = 'cap-message-id';

interface GroupState {
  consumer: KafkaConsumerClient;
  handlers: Map<string, CapHandler>;
  running: boolean;
}

export class KafkaSubscriber implements SubscriberPort {
  private readonly options: ResolvedKafkaOptions;
  private readonly client: KafkaClientFactory;
  private readonly topics: KafkaTopicManager;
  private readonly groups = new Map<string, GroupState>();

  constructor(options: KafkaOptions = {}) {
    this.options = resolveKafkaOptions(options);
    this.client = this.options.factory(kafkaClientConfig(this.options));
    this.topics = new KafkaTopicManager(this.client, this.options);
  }

  initialize(_options?: InitOptions): Promise<void> {
    return Promise.resolve();
  }

  async consume(
    topic: string,
    group: string,
    handler: CapHandler,
  ): Promise<void> {
    validateKafkaGroup(group);
    const resolvedTopic = kafkaTopic(this.options, topic);
    await this.topics.ensure(resolvedTopic);
    let state = this.groups.get(group);
    if (!state) {
      const consumer = this.client.consumer({
        ...this.options.consumer,
        groupId: group,
        autoCommit: false,
        allowAutoTopicCreation: false,
      });
      await consumer.connect();
      state = { consumer, handlers: new Map(), running: false };
      this.groups.set(group, state);
    }
    if (state.handlers.has(resolvedTopic)) return;
    state.handlers.set(resolvedTopic, handler);
    try {
      await state.consumer.subscribe({
        topics: [resolvedTopic],
        replace: false,
      });
      if (!state.running) {
        state.running = true;
        await state.consumer.run({
          eachMessage: (delivery) => this.dispatchDelivery(group, delivery),
        });
      }
    } catch (error) {
      state.handlers.delete(resolvedTopic);
      if (state.handlers.size === 0) {
        this.groups.delete(group);
        await state.consumer.stop().catch(() => undefined);
        await state.consumer.disconnect().catch(() => undefined);
      }
      throw error;
    }
  }

  /** Adapter delivery boundary, exposed for controlled broker harnesses. */
  async dispatchDelivery(
    group: string,
    delivery: EachMessagePayload,
  ): Promise<void> {
    const state = this.groups.get(group);
    const handler = state?.handlers.get(delivery.topic);
    if (!state || !handler)
      throw new Error(
        `Kafka delivery ${delivery.topic}|${group} has no matching CAP handler`,
      );
    const nextOffset = (BigInt(delivery.message.offset) + 1n).toString();
    try {
      const decoded = decodeMessage(
        delivery.message.value,
        delivery.message.headers,
      );
      await handler(
        decoded.payload,
        decoded.headers,
        inboundMetadata(delivery.topic, group, decoded.messageId),
      );
    } catch (error) {
      if (!(error instanceof KafkaMalformedMessageError)) throw error;
      this.options.logger?.error?.(
        `Skipping malformed Kafka message ${delivery.topic}|${group}`,
        error,
      );
    }
    await state.consumer.commitOffsets([
      {
        topic: delivery.topic,
        partition: delivery.partition,
        offset: nextOffset,
      },
    ]);
  }

  async close(): Promise<void> {
    const groups = [...this.groups.values()];
    this.groups.clear();
    for (const state of groups) {
      await state.consumer
        .stop()
        .catch((error) =>
          this.options.logger?.warn?.('Failed stopping Kafka consumer', error),
        );
      await state.consumer
        .disconnect()
        .catch((error) =>
          this.options.logger?.warn?.(
            'Failed disconnecting Kafka consumer',
            error,
          ),
        );
    }
  }
}

function decodeMessage(
  value: Buffer | null,
  rawHeaders: IHeaders | undefined,
): { payload: unknown; headers?: CapHeaders; messageId?: string } {
  if (headerString(rawHeaders?.[CONTENT_TYPE]) !== 'application/json') {
    throw new KafkaMalformedMessageError(
      'Kafka message content-type must be application/json',
    );
  }
  if (!value)
    throw new KafkaMalformedMessageError('Kafka message payload is empty');
  let payload: unknown;
  try {
    payload = JSON.parse(value.toString('utf8')) as unknown;
  } catch (error) {
    throw new KafkaMalformedMessageError(
      'Kafka message contains invalid JSON',
      error,
    );
  }
  const headers: CapHeaders = {};
  for (const [name, raw] of Object.entries(rawHeaders ?? {})) {
    if (name === CONTENT_TYPE || name === MESSAGE_ID || raw === undefined)
      continue;
    headers[name] = decodeHeaderValue(headerString(raw));
  }
  return {
    payload,
    headers: Object.keys(headers).length ? headers : undefined,
    messageId: headerString(rawHeaders?.[MESSAGE_ID]),
  };
}

function decodeHeaderValue(value: string): string | number | boolean {
  try {
    const decoded: unknown = JSON.parse(value);
    return typeof decoded === 'string' ||
      typeof decoded === 'number' ||
      typeof decoded === 'boolean'
      ? decoded
      : value;
  } catch {
    return value;
  }
}

function headerString(
  value: Buffer | string | Array<Buffer | string> | undefined,
): string {
  const scalar = Array.isArray(value) ? value[0] : value;
  return Buffer.isBuffer(scalar)
    ? scalar.toString('utf8')
    : String(scalar ?? '');
}

function inboundMetadata(
  topic: string,
  group: string,
  messageId?: string,
): SubscribeMetadata {
  return messageId
    ? { messageId, dedupeKey: `${topic}/${group}|${messageId}` }
    : {};
}
