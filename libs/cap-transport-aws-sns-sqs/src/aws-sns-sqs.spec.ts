import {
  defineTransportContract,
  type TransportContractPublishedMessage,
} from '@mikara89/cap-testing';
import type { CapHandler } from '@mikara89/cap-core';
import {
  AwsSnsDisconnectedError,
  AwsSnsPublisher,
  AwsSnsPublishTimeoutError,
  AwsSqsSubscriber,
} from './index';
import { FakeAwsBroker } from '../test/fake-aws';

const DEFAULT_QUEUE_URL =
  'https://sqs.us-east-1.amazonaws.com/000000000000/cap-orders';
const DEFAULT_TOPIC_ARN = 'arn:aws:sns:us-east-1:000000000000:cap-orders';
const CONTRACT_TOPIC_ARN =
  'arn:aws:sns:us-east-1:000000000000:contract.outbound';

describe('AWS SNS/SQS transport', () => {
  it('maps publish payload, headers, identity, and topic ARN', async () => {
    const broker = new FakeAwsBroker();
    const publisher = new AwsSnsPublisher({
      factory: broker.factory,
      topicArn: DEFAULT_TOPIC_ARN,
    });
    await publisher.initialize();
    await publisher.emit(
      'orders',
      { payload: { id: 1 }, source: 'external-system' },
      { trace: 'abc', attempt: 3, active: true },
      { messageId: 'message-1' },
    );

    expect(broker.published).toEqual([
      {
        topicArn: DEFAULT_TOPIC_ARN,
        message: '{"payload":{"id":1},"source":"external-system"}',
        messageAttributes: {
          'content-type': {
            DataType: 'String',
            StringValue: 'application/json',
          },
          trace: { DataType: 'String', StringValue: 'abc' },
          attempt: { DataType: 'Number', StringValue: '3' },
          active: { DataType: 'String', StringValue: 'true' },
          'cap-message-id': { DataType: 'String', StringValue: 'message-1' },
        },
      },
    ]);
    await publisher.close();
  });

  it('rejects disconnected, broker, timeout, and serialization failures deterministically', async () => {
    const broker = new FakeAwsBroker();
    const publisher = new AwsSnsPublisher({
      factory: broker.factory,
      topicArn: DEFAULT_TOPIC_ARN,
      publishTimeoutMs: 5,
    });
    await expect(publisher.emit('topic', {})).rejects.toBeInstanceOf(
      AwsSnsDisconnectedError,
    );
    await publisher.initialize();
    broker.failNextPublish = new Error('broker failure');
    await expect(publisher.emit('topic', {})).rejects.toThrow('broker failure');
    broker.pendingPublish = new Promise<never>(() => undefined);
    await expect(publisher.emit('topic', {})).rejects.toBeInstanceOf(
      AwsSnsPublishTimeoutError,
    );
    broker.pendingPublish = undefined;
    await expect(publisher.emit('topic', undefined)).rejects.toThrow(
      'JSON-serializable',
    );
    await publisher.close();
  });

  it('consumes payload, headers, and identity from SQS', async () => {
    const broker = new FakeAwsBroker();
    const subscriber = new AwsSqsSubscriber({
      factory: broker.factory,
      queueUrl: DEFAULT_QUEUE_URL,
      waitTimeSeconds: 1,
      maxNumberOfMessages: 10,
    });
    const handler = jest.fn().mockResolvedValue(undefined);
    await subscriber.consume('orders', 'billing', handler);

    const messageId = broker.deliver(DEFAULT_QUEUE_URL, '{"id":1}', {
      'content-type': { DataType: 'String', StringValue: 'application/json' },
      trace: { DataType: 'String', StringValue: 'trace-1' },
      'cap-message-id': { DataType: 'String', StringValue: 'message-1' },
    });

    // Wait for polling to pick up
    await sleep(200);
    expect(handler).toHaveBeenCalledWith(
      { id: 1 },
      { trace: 'trace-1' },
      {
        messageId: 'message-1',
        dedupeKey: `orders/billing|message-1`,
      },
    );

    // Message should be deleted after handler success
    const queue = broker.getOrCreateQueue(DEFAULT_QUEUE_URL);
    expect(queue.deleted.has(`receipt-${messageId}`)).toBe(true);
    await subscriber.close();
  });

  it('deletes message after handler success', async () => {
    const broker = new FakeAwsBroker();
    const subscriber = new AwsSqsSubscriber({
      factory: broker.factory,
      queueUrl: DEFAULT_QUEUE_URL,
      waitTimeSeconds: 1,
    });
    await subscriber.consume('orders', 'billing', () => undefined);
    const messageId = broker.deliver(DEFAULT_QUEUE_URL, '{}', {
      'content-type': { DataType: 'String', StringValue: 'application/json' },
    });
    await sleep(200);
    const queue = broker.getOrCreateQueue(DEFAULT_QUEUE_URL);
    expect(queue.deleted.has(`receipt-${messageId}`)).toBe(true);
    await subscriber.close();
  });

  it('does not delete message on handler failure', async () => {
    const broker = new FakeAwsBroker();
    const subscriber = new AwsSqsSubscriber({
      factory: broker.factory,
      queueUrl: DEFAULT_QUEUE_URL,
      waitTimeSeconds: 1,
    });
    const error = new Error('CAP inbox boundary failed');
    await subscriber.consume('orders', 'billing', async () =>
      Promise.reject(error),
    );
    const messageId = broker.deliver(DEFAULT_QUEUE_URL, '{}', {
      'content-type': { DataType: 'String', StringValue: 'application/json' },
    });
    await sleep(200);
    const queue = broker.getOrCreateQueue(DEFAULT_QUEUE_URL);
    // Message should NOT be deleted (handler failed)
    expect(queue.deleted.has(`receipt-${messageId}`)).toBe(false);
    await subscriber.close();
  });

  it.each([
    [
      '{bad',
      {
        'content-type': { DataType: 'String', StringValue: 'application/json' },
      },
    ],
    [
      '{}',
      { 'content-type': { DataType: 'String', StringValue: 'text/plain' } },
    ],
    [
      '',
      {
        'content-type': { DataType: 'String', StringValue: 'application/json' },
      },
    ],
  ] as const)(
    'deletes malformed messages to prevent poison-message loops',
    async (body, attributes) => {
      const broker = new FakeAwsBroker();
      const subscriber = new AwsSqsSubscriber({
        factory: broker.factory,
        queueUrl: DEFAULT_QUEUE_URL,
        waitTimeSeconds: 1,
      });
      const handler = jest.fn();
      await subscriber.consume('orders', 'billing', handler);
      const messageId = broker.deliver(DEFAULT_QUEUE_URL, body, attributes);
      await sleep(200);
      expect(handler).not.toHaveBeenCalled();
      const queue = broker.getOrCreateQueue(DEFAULT_QUEUE_URL);
      expect(queue.deleted.has(`receipt-${messageId}`)).toBe(true);
      await subscriber.close();
    },
  );

  it('cleans up publisher and subscribers idempotently', async () => {
    const broker = new FakeAwsBroker();
    const publisher = new AwsSnsPublisher({
      factory: broker.factory,
      topicArn: DEFAULT_TOPIC_ARN,
    });
    const subscriber = new AwsSqsSubscriber({
      factory: broker.factory,
      queueUrl: DEFAULT_QUEUE_URL,
      waitTimeSeconds: 1,
    });
    await publisher.initialize();
    await subscriber.consume('orders', 'billing', jest.fn());
    await publisher.close();
    await publisher.close();
    await subscriber.close();
    await subscriber.close();
    expect(broker.activeSnsClients()).toBe(0);
    expect(broker.activeSqsClients()).toBe(0);
  });

  it('publisher initialization supports repeated lifecycle calls', async () => {
    const broker = new FakeAwsBroker();
    const publisher = new AwsSnsPublisher({
      factory: broker.factory,
      topicArn: DEFAULT_TOPIC_ARN,
    });
    await publisher.initialize();
    await publisher.initialize();
    await publisher.initialize();
    await publisher.emit('orders', { ok: true });
    expect(broker.published).toHaveLength(1);
    await publisher.close();
  });

  it('auto-provisions the configured topic, queue, policy, and subscription', async () => {
    const broker = new FakeAwsBroker();
    const options = {
      factory: broker.factory,
      autoProvision: true,
      topicName: 'cap-orders',
      queueName: 'cap-orders-billing',
      waitTimeSeconds: 7,
      maxNumberOfMessages: 4,
      visibilityTimeout: 45,
      concurrency: 2,
    };
    const publisher = new AwsSnsPublisher(options);
    const subscriber = new AwsSqsSubscriber(options);

    await publisher.initialize();
    await subscriber.consume('orders', 'billing', jest.fn());
    await publisher.emit('orders', { id: 1 });
    await sleep(20);

    expect(broker.createdTopics.get('cap-orders')).toBe(
      'arn:aws:sns:us-east-1:000000000000:cap-orders',
    );
    expect(broker.createdQueues.has('cap-orders-billing')).toBe(true);
    expect(broker.subscriptions).toEqual([
      {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:cap-orders',
        queueArn: 'arn:aws:sqs:us-east-1:000000000000:cap-orders-billing',
      },
    ]);
    expect(broker.receiveRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          maxNumberOfMessages: 4,
          waitTimeSeconds: 7,
          visibilityTimeout: 45,
        }),
      ]),
    );
    expect(broker.activeSqsClients()).toBe(1);
    await publisher.close();
    await subscriber.close();
    expect(broker.activeSnsClients()).toBe(0);
    expect(broker.activeSqsClients()).toBe(0);
  });

  it.each([
    [{ waitTimeSeconds: -1 }, 'waitTimeSeconds'],
    [{ waitTimeSeconds: 21 }, 'waitTimeSeconds'],
    [{ maxNumberOfMessages: 0 }, 'maxNumberOfMessages'],
    [{ maxNumberOfMessages: 11 }, 'maxNumberOfMessages'],
    [{ visibilityTimeout: 0 }, 'visibilityTimeout'],
  ] as const)('validates SQS polling option %s', (options, message) => {
    expect(() => new AwsSqsSubscriber(options)).toThrow(message);
  });

  it('rejects ambiguous multiple CAP subscriptions on one configured SQS queue', async () => {
    const broker = new FakeAwsBroker();
    const subscriber = new AwsSqsSubscriber({
      factory: broker.factory,
      queueUrl: DEFAULT_QUEUE_URL,
      waitTimeSeconds: 0,
    });
    await subscriber.consume('orders', 'billing', jest.fn());
    await expect(
      subscriber.consume('payments', 'billing', jest.fn()),
    ).rejects.toThrow('one CAP subscription');
    await subscriber.close();
  });
});

defineTransportContract(
  'AWS SNS/SQS',
  async () => {
    const broker = new FakeAwsBroker();
    const publisher = new AwsSnsPublisher({
      factory: broker.factory,
      topicArn: CONTRACT_TOPIC_ARN,
    });
    const subscriber = new AwsSqsSubscriber({
      factory: broker.factory,
      queueUrl: DEFAULT_QUEUE_URL,
      waitTimeSeconds: 0, // short poll for contract tests
    });
    await publisher.initialize();

    // Register a direct handler so harness.deliver can invoke synchronously
    const handlerMap = new Map<string, CapHandler>();
    const originalConsume = subscriber.consume.bind(subscriber);
    subscriber.consume = (
      topic: string,
      group: string,
      handler: CapHandler,
    ) => {
      handlerMap.set(`${topic}/${group}`, handler);
      return originalConsume(topic, group, handler);
    };

    const publishedMessages = (): TransportContractPublishedMessage[] =>
      broker.published.map((message) => {
        // Extract logical topic from ARN: arn:aws:sns:region:account:topicName
        const arnParts = message.topicArn.split(':');
        const logicalTopic = arnParts[arnParts.length - 1] || message.topicArn;
        return {
          topic: logicalTopic,
          payload: JSON.parse(message.message),
          headers: Object.fromEntries(
            Object.entries(message.messageAttributes ?? {})
              .filter(
                ([name]) => !['content-type', 'cap-message-id'].includes(name),
              )
              .map(([name, attr]) => {
                const value = attr.StringValue;
                return [
                  name,
                  attr.DataType === 'Number' ? Number(value) : value,
                ];
              }),
          ),
          metadata: message.messageAttributes?.['cap-message-id']
            ? {
                messageId:
                  message.messageAttributes['cap-message-id'].StringValue,
              }
            : undefined,
        };
      });
    return {
      publisher,
      subscriber,
      harness: {
        publishedMessages,
        failNextPublish: (error) => {
          broker.failNextPublish = error;
        },
        deliver: async ({ topic, group, payload, headers }) => {
          const handler = handlerMap.get(`${topic}/${group}`);
          if (!handler) throw new Error(`No handler for ${topic}/${group}`);
          await handler(payload, headers, {
            messageId: 'inbound-message-id',
            dedupeKey: `${topic}/${group}|inbound-message-id`,
          });
        },
        activePublisherResources: () => broker.activeSnsClients(),
        activeSubscriberResources: () => broker.activeSqsClients(),
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
