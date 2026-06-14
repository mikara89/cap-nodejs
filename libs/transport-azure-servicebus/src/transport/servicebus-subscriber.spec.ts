/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@azure/service-bus', () => {
  const actual = jest.requireActual('@azure/service-bus');
  return {
    ...actual,
    ServiceBusAdministrationClient: jest.fn(),
  };
});

import {
  ServiceBusAdministrationClient,
  type ServiceBusClient,
  type ServiceBusReceiver,
} from '@azure/service-bus';
import { ServiceBusSubscriber } from './servicebus-subscriber';

type MockAdminClient = {
  getQueue: jest.Mock;
  getTopic: jest.Mock;
  getSubscription: jest.Mock;
  createQueue: jest.Mock;
  createTopic: jest.Mock;
  createSubscription: jest.Mock;
};

describe('ServiceBusSubscriber', () => {
  let subscriber: ServiceBusSubscriber;
  let mockClient: jest.Mocked<ServiceBusClient>;
  let mockReceiver: jest.Mocked<ServiceBusReceiver>;
  let mockAdmin: MockAdminClient;
  let MockServiceBusAdministrationClient: jest.Mock;

  beforeEach(() => {
    mockReceiver = {
      subscribe: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusReceiver>;

    mockClient = {
      createReceiver: jest.fn().mockReturnValue(mockReceiver),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusClient>;

    mockAdmin = {
      getQueue: jest.fn().mockResolvedValue({}),
      getTopic: jest.fn().mockResolvedValue({}),
      getSubscription: jest.fn().mockResolvedValue({}),
      createQueue: jest.fn().mockResolvedValue({}),
      createTopic: jest.fn().mockResolvedValue({}),
      createSubscription: jest.fn().mockResolvedValue({}),
    };

    MockServiceBusAdministrationClient =
      ServiceBusAdministrationClient as unknown as jest.Mock;
    MockServiceBusAdministrationClient.mockClear();
    MockServiceBusAdministrationClient.mockImplementation(() => mockAdmin);

    subscriber = new ServiceBusSubscriber(mockClient, {
      connectionString:
        'Endpoint=sb://local/;SharedAccessKeyName=test;SharedAccessKey=key',
      topicPrefix: 'cap-',
      subscriptionPrefix: 'sub-',
    });
  });

  describe('consume', () => {
    it('should create receiver and subscribe with handler', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      await subscriber.consume('user.created', 'email-service', handler);

      expect(mockClient.createReceiver).toHaveBeenCalledWith(
        'cap-user.created',
        'sub-email-service',
      );
      expect(mockReceiver.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          processMessage: expect.any(Function),
          processError: expect.any(Function),
        }),
        { maxConcurrentCalls: 1 },
      );
    });

    it('should create a queue receiver in queue mode', async () => {
      subscriber = new ServiceBusSubscriber(mockClient, {
        connectionString:
          'Endpoint=sb://local/;SharedAccessKeyName=test;SharedAccessKey=key',
        mode: 'queue',
        queuePrefix: 'queue-',
        topicPrefix: 'cap-',
        subscriptionPrefix: 'sub-',
      });

      await subscriber.consume('user.created', 'email-service', jest.fn());

      expect(mockClient.createReceiver).toHaveBeenCalledWith(
        'queue-user.created',
      );
    });

    it('should not create an admin client when provisioning is disabled', async () => {
      await subscriber.consume('topic-x', 'group-y', jest.fn());

      expect(MockServiceBusAdministrationClient).not.toHaveBeenCalled();
      expect(mockAdmin.getTopic).not.toHaveBeenCalled();
      expect(mockAdmin.getSubscription).not.toHaveBeenCalled();
    });

    it('should fall back to topic subscription when queue mode finds an existing topic', async () => {
      mockAdmin.getQueue.mockRejectedValueOnce(new Error('missing queue'));
      mockAdmin.getTopic.mockResolvedValueOnce({});
      mockAdmin.getSubscription.mockRejectedValueOnce(
        new Error('missing subscription'),
      );
      subscriber = new ServiceBusSubscriber(mockClient, {
        connectionString:
          'Endpoint=sb://local/;SharedAccessKeyName=test;SharedAccessKey=key',
        mode: 'queue',
        queuePrefix: 'queue-',
        subscriptionPrefix: 'sub-',
      });

      await subscriber.initialize?.({ createQueues: true });
      await subscriber.consume('topic-x', 'group-y', jest.fn());

      expect(mockAdmin.createSubscription).toHaveBeenCalledWith(
        'queue-topic-x',
        'sub-group-y',
      );
      expect(mockClient.createReceiver).toHaveBeenCalledWith(
        'queue-topic-x',
        'sub-group-y',
      );
    });

    it('should subscribe even when queue provisioning fails', async () => {
      mockAdmin.getQueue.mockRejectedValueOnce(new Error('missing queue'));
      mockAdmin.getTopic.mockRejectedValueOnce(new Error('missing topic'));
      mockAdmin.createQueue.mockRejectedValueOnce(new Error('create failed'));
      subscriber = new ServiceBusSubscriber(mockClient, {
        connectionString:
          'Endpoint=sb://local/;SharedAccessKeyName=test;SharedAccessKey=key',
        mode: 'queue',
        queuePrefix: 'queue-',
      });

      await subscriber.initialize?.({ createQueues: true });
      await subscriber.consume('topic-x', 'group-y', jest.fn());

      expect(mockAdmin.createQueue).toHaveBeenCalledWith('queue-topic-x');
      expect(mockClient.createReceiver).toHaveBeenCalledWith('queue-topic-x');
      expect(mockReceiver.subscribe).toHaveBeenCalled();
    });

    it('should invoke handler with message body and properties', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      let processMessage: ((message: unknown) => Promise<void>) | undefined;

      mockReceiver.subscribe.mockImplementation((handlers: unknown) => {
        processMessage = (
          handlers as { processMessage: (message: unknown) => Promise<void> }
        ).processMessage;
        return { close: jest.fn() };
      });

      await subscriber.consume('topic-x', 'group-y', handler);

      const mockMessage = {
        messageId: 'msg-123',
        body: { foo: 'bar' },
        applicationProperties: { 'x-trace': '456' },
      };

      await processMessage?.(mockMessage);

      expect(handler).toHaveBeenCalledWith(
        { foo: 'bar' },
        { 'x-trace': '456' },
        {
          messageId: 'msg-123',
          dedupeKey: 'cap-topic-x/sub-group-y|msg-123',
        },
      );
    });

    it('should pass configured maxConcurrentCalls to subscribe', async () => {
      subscriber = new ServiceBusSubscriber(mockClient, {
        connectionString:
          'Endpoint=sb://local/;SharedAccessKeyName=test;SharedAccessKey=key',
        topicPrefix: 'cap-',
        subscriptionPrefix: 'sub-',
        maxConcurrentCalls: 7,
      });

      await subscriber.consume('topic-x', 'group-y', jest.fn());

      expect(mockReceiver.subscribe).toHaveBeenCalledWith(expect.any(Object), {
        maxConcurrentCalls: 7,
      });
    });

    it('should cache receiver instances per topic-group pair', async () => {
      await subscriber.consume('topic-a', 'group-1', jest.fn());
      await subscriber.consume('topic-a', 'group-1', jest.fn());

      expect(mockClient.createReceiver).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all receivers and client', async () => {
      await subscriber.consume('topic-a', 'group-1', jest.fn());
      await subscriber.onModuleDestroy();

      expect(mockReceiver.close).toHaveBeenCalled();
      // ServiceBusSubscriber does not close the client instance
    });
  });
});
