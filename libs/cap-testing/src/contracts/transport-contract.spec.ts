import {
  createInMemoryPublisher,
  createInMemorySubscriber,
} from '@mikara89/cap-core';
import { defineTransportContract } from './transport-contract';

defineTransportContract(
  'in-memory fakes',
  () => {
    const basePublisher = createInMemoryPublisher();
    const baseSubscriber = createInMemorySubscriber();
    let activePublisherResources = 0;
    let activeSubscriberResources = 0;
    const emit = basePublisher.emit.bind(basePublisher);
    const consume = baseSubscriber.consume.bind(baseSubscriber);

    const publisher = Object.assign(basePublisher, {
      initialize: () => Promise.resolve(),
      close: () => {
        activePublisherResources = 0;
        return Promise.resolve();
      },
    });
    const subscriber = Object.assign(baseSubscriber, {
      initialize: () => Promise.resolve(),
      close: () => {
        activeSubscriberResources = 0;
        baseSubscriber.listeners.clear();
        return Promise.resolve();
      },
    });

    publisher.emit = async (...args) => {
      activePublisherResources = 1;
      await emit(...args);
    };
    subscriber.consume = async (...args) => {
      activeSubscriberResources = 1;
      await consume(...args);
    };

    return Promise.resolve({
      publisher,
      subscriber,
      harness: {
        publishedMessages: () => publisher.emitted,
        failNextPublish: (error: Error) => {
          publisher.error = error;
        },
        deliver: async ({ topic, group, payload, headers }) =>
          subscriber.deliver(topic, group, payload, headers, {
            messageId: 'inbound-message-id',
            dedupeKey: 'inbound-dedupe-key',
          }),
        activePublisherResources: () => activePublisherResources,
        activeSubscriberResources: () => activeSubscriberResources,
      },
      expectedInboundMetadata: {
        messageId: 'inbound-message-id',
        dedupeKey: 'inbound-dedupe-key',
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
