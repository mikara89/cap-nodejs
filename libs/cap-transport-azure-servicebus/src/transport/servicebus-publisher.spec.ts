/* eslint-disable @typescript-eslint/unbound-method */

import {
  type ServiceBusClient,
  type ServiceBusSender,
} from '@azure/service-bus';
import { ServiceBusPublisher } from './servicebus-publisher';

describe('ServiceBusPublisher', () => {
  let publisher: ServiceBusPublisher;
  let mockClient: jest.Mocked<ServiceBusClient>;
  let mockSender: jest.Mocked<ServiceBusSender>;

  beforeEach(() => {
    mockSender = {
      sendMessages: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusSender>;

    mockClient = {
      createSender: jest.fn().mockReturnValue(mockSender),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusClient>;

    publisher = new ServiceBusPublisher(mockClient, {
      connectionString: '',
      topicPrefix: 'cap-',
      subscriptionPrefix: 'sub-',
    });
  });

  describe('emit', () => {
    it('should send message to Service Bus topic', async () => {
      const payload = {
        payload: { userId: 123 },
        source: 'external-system',
      };

      await publisher.emit('user.created', payload);

      expect(mockClient.createSender).toHaveBeenCalledWith('cap-user.created');
      expect(mockSender.sendMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          body: payload,
        }),
      );
    });

    it('should send headers as Service Bus application properties', async () => {
      const headers = { traceId: 'abc', attempt: 1 };

      await publisher.emit('user.created', { userId: 123 }, headers);

      expect(mockSender.sendMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationProperties: headers,
        }),
      );
    });

    it('should cache sender instances per topic', async () => {
      await publisher.emit('topic-a', {});
      await publisher.emit('topic-a', {});

      expect(mockClient.createSender).toHaveBeenCalledTimes(1);
      expect(mockSender.sendMessages).toHaveBeenCalledTimes(2);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all senders and client', async () => {
      await publisher.emit('test-topic', {});
      await publisher.onModuleDestroy();

      expect(mockSender.close).toHaveBeenCalled();
    });
  });
});
