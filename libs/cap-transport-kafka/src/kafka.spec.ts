import {
  defineTransportContract,
  type TransportContractPublishedMessage,
} from '@mikara89/cap-testing';
import {
  KafkaDisconnectedError,
  KafkaPublisher,
  KafkaPublishTimeoutError,
  KafkaSubscriber,
} from './index';
import { FakeKafkaBroker } from '../test/fake-kafka';
import type { FakeKafkaConsumer } from '../test/fake-kafka';

describe('Kafka transport', () => {
  it('maps publish payload, headers, identity, prefix, acks, and disables broker auto-create', async () => {
    const broker = new FakeKafkaBroker();
    const publisher = new KafkaPublisher({
      factory: broker.factory,
      topicPrefix: 'cap.',
      producer: { acks: 1 },
    });
    await publisher.initialize();
    expect(broker.clientConfigs[0]).toEqual({
      clientId: 'cap-nodejs',
      brokers: ['localhost:9092'],
    });
    await publisher.emit(
      'orders',
      { payload: { id: 1 }, source: 'external-system' },
      { trace: 'abc', attempt: 2, active: true },
      { messageId: 'message-1' },
    );

    expect(broker.producerConfig).toEqual(
      expect.objectContaining({
        acks: 1,
        allowAutoTopicCreation: false,
      }),
    );
    expect(broker.published).toEqual([
      {
        topic: 'cap.orders',
        value: Buffer.from('{"payload":{"id":1},"source":"external-system"}'),
        headers: {
          'content-type': 'application/json',
          trace: '"abc"',
          attempt: '2',
          active: 'true',
          'cap-message-id': 'message-1',
        },
      },
    ]);
    expect(broker.createdTopics).toEqual([]);
    await publisher.close();
  });

  it('rejects disconnected, broker, timeout, and serialization failures deterministically', async () => {
    const broker = new FakeKafkaBroker();
    const publisher = new KafkaPublisher({
      factory: broker.factory,
      publishTimeoutMs: 5,
    });
    await expect(publisher.emit('topic', {})).rejects.toBeInstanceOf(
      KafkaDisconnectedError,
    );
    await publisher.initialize();
    broker.failNextPublish = new Error('broker failure');
    await expect(publisher.emit('topic', {})).rejects.toThrow('broker failure');
    broker.pendingPublish = new Promise<never>(() => undefined);
    await expect(publisher.emit('topic', {})).rejects.toBeInstanceOf(
      KafkaPublishTimeoutError,
    );
    broker.pendingPublish = undefined;
    await expect(publisher.emit('topic', undefined)).rejects.toThrow(
      'JSON-serializable',
    );
    await publisher.close();
  });

  it('uses manual commits and commits only after handler success', async () => {
    const broker = new FakeKafkaBroker();
    const subscriber = new KafkaSubscriber({ factory: broker.factory });
    const handler = jest.fn().mockResolvedValue(undefined);
    await subscriber.consume('orders', 'billing', handler);
    await broker.deliver(
      'billing',
      'orders',
      Buffer.from('{"id":1}'),
      {
        'content-type': 'application/json',
        trace: Buffer.from('trace-1'),
        'cap-message-id': 'message-1',
      },
      '41',
    );
    const consumer = currentConsumer(broker);
    expect(handler).toHaveBeenCalledWith(
      { id: 1 },
      { trace: 'trace-1' },
      { messageId: 'message-1', dedupeKey: 'orders/billing|message-1' },
    );
    expect(consumer.commits).toEqual([
      { topic: 'orders', partition: 0, offset: '42' },
    ]);
    expect(broker.consumerConfigs[0]).toEqual(
      expect.objectContaining({
        groupId: 'billing',
        fromBeginning: true,
        autoCommit: false,
        allowAutoTopicCreation: false,
      }),
    );
    await subscriber.close();
  });

  it('does not commit a handler failure and propagates it', async () => {
    const broker = new FakeKafkaBroker();
    const subscriber = new KafkaSubscriber({ factory: broker.factory });
    const error = new Error('CAP inbox boundary failed');
    await subscriber.consume('orders', 'billing', async () =>
      Promise.reject(error),
    );
    await expect(
      broker.deliver('billing', 'orders', Buffer.from('{}'), {
        'content-type': 'application/json',
      }),
    ).rejects.toBe(error);
    expect(currentConsumer(broker).commits).toEqual([]);
    await subscriber.close();
  });

  it.each([
    [Buffer.from('{bad'), { 'content-type': 'application/json' }],
    [Buffer.from('{}'), { 'content-type': 'text/plain' }],
    [Buffer.alloc(0), { 'content-type': 'application/json' }],
  ] as const)(
    'skips and commits malformed messages once',
    async (value, headers) => {
      const broker = new FakeKafkaBroker();
      const subscriber = new KafkaSubscriber({ factory: broker.factory });
      const handler = jest.fn();
      await subscriber.consume('orders', 'billing', handler);
      await expect(
        broker.deliver('billing', 'orders', value, headers),
      ).resolves.toBeUndefined();
      expect(handler).not.toHaveBeenCalled();
      expect(currentConsumer(broker).commits).toHaveLength(1);
      await subscriber.close();
    },
  );

  it('creates explicitly configured topics only when opted in', async () => {
    const broker = new FakeKafkaBroker();
    const publisher = new KafkaPublisher({
      factory: broker.factory,
      autoCreateTopics: true,
      topicCreation: {
        partitions: 3,
        replicationFactor: 2,
        config: { 'retention.ms': '60000' },
      },
    });
    await publisher.initialize();
    await publisher.emit('orders', {});
    expect(broker.createdTopics).toEqual([
      {
        topics: [
          {
            topic: 'orders',
            numPartitions: 3,
            replicationFactor: 2,
            configEntries: [{ name: 'retention.ms', value: '60000' }],
          },
        ],
      },
    ]);
    await publisher.close();
  });

  it('cleans up publisher and all group consumers idempotently', async () => {
    const broker = new FakeKafkaBroker();
    const publisher = new KafkaPublisher({ factory: broker.factory });
    const subscriber = new KafkaSubscriber({ factory: broker.factory });
    await publisher.initialize();
    await subscriber.consume('orders', 'billing', jest.fn());
    await subscriber.consume('orders', 'audit', jest.fn());
    await publisher.close();
    await publisher.close();
    await subscriber.close();
    await subscriber.close();
    expect(broker.producerConnected).toBe(0);
    expect(broker.consumers.size).toBe(0);
  });
});

defineTransportContract(
  'Kafka',
  async () => {
    const broker = new FakeKafkaBroker();
    const publisher = new KafkaPublisher({ factory: broker.factory });
    const subscriber = new KafkaSubscriber({ factory: broker.factory });
    await publisher.initialize();
    const publishedMessages = (): TransportContractPublishedMessage[] =>
      broker.published.map((message) => ({
        topic: message.topic,
        payload: JSON.parse(message.value.toString('utf8')),
        headers: Object.fromEntries(
          Object.entries(message.headers ?? {})
            .filter(
              ([name]) => !['content-type', 'cap-message-id'].includes(name),
            )
            .map(([name, value]) => [name, JSON.parse(String(value))]),
        ),
        metadata: message.headers?.['cap-message-id']
          ? { messageId: String(message.headers['cap-message-id']) }
          : undefined,
      }));
    return {
      publisher,
      subscriber,
      harness: {
        publishedMessages,
        failNextPublish: (error) => {
          broker.failNextPublish = error;
        },
        deliver: async ({ topic, group, payload, headers }) =>
          broker.deliver(group, topic, Buffer.from(JSON.stringify(payload)), {
            'content-type': 'application/json',
            ...Object.fromEntries(
              Object.entries(headers ?? {}).map(([key, value]) => [
                key,
                String(value),
              ]),
            ),
            'cap-message-id': 'inbound-message-id',
          }),
        activePublisherResources: () => broker.producerConnected,
        activeSubscriberResources: () => broker.consumers.size,
      },
      expectedInboundMetadata: {
        messageId: 'inbound-message-id',
        dedupeKey: 'contract.inbound/contract-group|inbound-message-id',
      },
      cleanup: async () => {
        await publisher.close();
        await subscriber.close();
      },
    };
  },
  {
    supportsPublisherInitialization: true,
    supportsSubscriberInitialization: true,
    supportsPublisherDisposal: true,
    supportsSubscriberDisposal: true,
  },
);

function currentConsumer(broker: FakeKafkaBroker): FakeKafkaConsumer {
  const consumer = [...broker.consumers][0];
  if (!consumer) throw new Error('No fake Kafka consumer');
  return consumer;
}
