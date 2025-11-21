/* eslint-disable @typescript-eslint/unbound-method */

import { Test } from '@nestjs/testing';
import { ServiceBusClient, type ServiceBusSender } from '@azure/service-bus';
import { ServiceBusPublisher } from './servicebus-publisher';

describe('ServiceBusPublisher', () => {
  let publisher: ServiceBusPublisher;
  let mockClient: jest.Mocked<ServiceBusClient>;
  let mockSender: jest.Mocked<ServiceBusSender>;

  beforeEach(async () => {
    mockSender = {
      sendMessages: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusSender>;

    mockClient = {
      createSender: jest.fn().mockReturnValue(mockSender),
      close: jest.fn(),
    } as unknown as jest.Mocked<ServiceBusClient>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServiceBusPublisher,
        { provide: ServiceBusClient, useValue: mockClient },
        {
          provide: 'CAP_SERVICEBUS_CONFIG',
          useValue: { topicPrefix: 'cap-', subscriptionPrefix: 'sub-' },
        },
      ],
    }).compile();

    publisher = moduleRef.get(ServiceBusPublisher);
  });

  describe('emit', () => {
    it('should send message to Service Bus topic', async () => {
      const payload = { userId: 123 };

      await publisher.emit('user.created', payload);

      expect(mockClient.createSender).toHaveBeenCalledWith('cap-user.created');
      expect(mockSender.sendMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userId: 123 },
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
