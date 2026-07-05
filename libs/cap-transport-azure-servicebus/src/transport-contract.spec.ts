import type {
  ServiceBusClient,
  ServiceBusReceivedMessage,
  ServiceBusReceiver,
  ServiceBusSender,
} from '@azure/service-bus';
import type { CapHeaders } from '@mikara89/cap-core';
import {
  defineTransportContract,
  type TransportContractPublishedMessage,
} from '@mikara89/cap-testing';
import { ServiceBusPublisher } from './transport/servicebus-publisher';
import { ServiceBusSubscriber } from './transport/servicebus-subscriber';

interface ReceiverHandlers {
  processMessage(message: ServiceBusReceivedMessage): Promise<void>;
}

defineTransportContract(
  'Azure Service Bus',
  () => {
    const published: TransportContractPublishedMessage[] = [];
    const activeSenders = new Set<ServiceBusSender>();
    const activeReceivers = new Set<ServiceBusReceiver>();
    const receiverHandlers = new Map<string, ReceiverHandlers>();
    let publishError: Error | undefined;

    const client = {
      createSender: jest.fn((resourceName: string) => {
        const sender = {
          sendMessages: jest.fn((message) => {
            if (publishError) {
              const error = publishError;
              publishError = undefined;
              return Promise.reject(error);
            }
            published.push({
              topic: resourceName.replace(/^cap-/, ''),
              payload: message.body,
              headers: message.applicationProperties as CapHeaders | undefined,
              metadata: { messageId: String(message.messageId) },
            });
            return Promise.resolve();
          }),
          close: jest.fn(() => {
            activeSenders.delete(sender);
            return Promise.resolve();
          }),
        } as unknown as ServiceBusSender;
        activeSenders.add(sender);
        return sender;
      }),
      createReceiver: jest.fn(
        (resourceName: string, subscriptionName?: string) => {
          const key = subscriptionName
            ? `${resourceName}/${subscriptionName}`
            : resourceName;
          const receiver = {
            subscribe: jest.fn((handlers: ReceiverHandlers) => {
              receiverHandlers.set(key, handlers);
              return { close: jest.fn() };
            }),
            close: jest.fn(() => {
              activeReceivers.delete(receiver);
              receiverHandlers.delete(key);
              return Promise.resolve();
            }),
          } as unknown as ServiceBusReceiver;
          activeReceivers.add(receiver);
          return receiver;
        },
      ),
      close: jest.fn(),
    } as unknown as ServiceBusClient;
    const config = {
      connectionString: '',
      topicPrefix: 'cap-',
      subscriptionPrefix: 'sub-',
    };
    const publisher = new ServiceBusPublisher(client, config);
    const subscriber = new ServiceBusSubscriber(client, config);

    return Promise.resolve({
      publisher,
      subscriber,
      harness: {
        publishedMessages: () => published,
        failNextPublish: (error: Error) => {
          publishError = error;
        },
        deliver: async ({ topic, group, payload, headers }) => {
          const key = `cap-${topic}/sub-${group}`;
          const handlers = receiverHandlers.get(key);
          if (!handlers) {
            throw new Error(`No Service Bus receiver registered for ${key}`);
          }
          await handlers.processMessage({
            body: payload,
            applicationProperties: headers,
            messageId: 'inbound-message-id',
          } as ServiceBusReceivedMessage);
        },
        activePublisherResources: () => activeSenders.size,
        activeSubscriberResources: () => activeReceivers.size,
      },
      expectedInboundMetadata: {
        messageId: 'inbound-message-id',
        dedupeKey: 'cap-contract.inbound/sub-contract-group|inbound-message-id',
      },
      cleanup: async () => {
        await publisher.close();
        await subscriber.close();
      },
    });
  },
  {
    supportsPublisherInitialization: true,
    supportsSubscriberInitialization: true,
    supportsPublisherDisposal: true,
    supportsSubscriberDisposal: true,
  },
);
