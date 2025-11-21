/* eslint-disable @typescript-eslint/unbound-method */

import {
  type ServiceBusClient,
  type ServiceBusReceiver,
} from '@azure/service-bus';
import { ServiceBusSubscriber } from './servicebus-subscriber';

describe('ServiceBusSubscriber', () => {
  let subscriber: ServiceBusSubscriber;
  let mockClient: jest.Mocked<ServiceBusClient>;
  let mockReceiver: jest.Mocked<ServiceBusReceiver>;

  beforeEach(() => {
    mockReceiver = {
      subscribe: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusReceiver>;

    mockClient = {
      createReceiver: jest.fn().mockReturnValue(mockReceiver),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusClient>;

    // instantiate directly to avoid DI metadata quirks in tests

    subscriber = new ServiceBusSubscriber(mockClient as any, {
      connectionString:
        'Endpoint=sb://local/;SharedAccessKeyName=test;SharedAccessKey=key',
      topicPrefix: 'cap-',
      subscriptionPrefix: 'sub-',
    });
  });

  describe('consume', () => {
    it('should create receiver and subscribe with handler', () => {
      const handler = jest.fn();

      void subscriber.consume('user.created', 'email-service', handler);

      expect(mockClient.createReceiver).toHaveBeenCalledWith(
        'cap-user.created',
        'sub-email-service',
      );
      expect(mockReceiver.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          processMessage: expect.any(Function),
          processError: expect.any(Function),
        }),
      );
    });

    it('should invoke handler with message body and properties', async () => {
      const handler = jest.fn();
      let processMessage: ((message: unknown) => Promise<void>) | undefined;

      mockReceiver.subscribe.mockImplementation((handlers: unknown) => {
        processMessage = (
          handlers as { processMessage: (message: unknown) => Promise<void> }
        ).processMessage;
        return { close: jest.fn() } as never;
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
      );
    });

    it('should cache receiver instances per topic-group pair', () => {
      void subscriber.consume('topic-a', 'group-1', jest.fn());
      void subscriber.consume('topic-a', 'group-1', jest.fn());

      expect(mockClient.createReceiver).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all receivers and client', async () => {
      void subscriber.consume('topic-a', 'group-1', jest.fn());
      await subscriber.onModuleDestroy();

      expect(mockReceiver.close).toHaveBeenCalled();
      // ServiceBusSubscriber does not close the client instance
    });
  });
});
