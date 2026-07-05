import type {
  CapHeaders,
  InitOptions,
  PublisherPort,
  PublishMetadata,
  SubscriberPort,
  SubscribeMetadata,
} from '@mikara89/cap-core';

export interface TransportContractPublishedMessage {
  topic: string;
  payload: unknown;
  headers?: CapHeaders;
  metadata?: PublishMetadata;
}

export interface TransportContractDelivery {
  topic: string;
  group: string;
  payload: unknown;
  headers?: CapHeaders;
}

export interface TransportContractHarness {
  publishedMessages: () => readonly TransportContractPublishedMessage[];
  failNextPublish: (error: Error) => void;
  deliver: (delivery: TransportContractDelivery) => Promise<void>;
  activePublisherResources?: () => number;
  activeSubscriberResources?: () => number;
}

export interface TransportContractPublisher extends PublisherPort {
  /** Adapter extension; PublisherPort does not currently define disposal. */
  close?(): Promise<void>;
}

export interface TransportContractSetup {
  publisher: TransportContractPublisher;
  subscriber: SubscriberPort;
  harness: TransportContractHarness;
  expectedInboundMetadata: SubscribeMetadata;
  cleanup: () => Promise<void>;
}

export interface TransportContractCapabilities {
  supportsPublisherInitialization: boolean;
  supportsSubscriberInitialization: boolean;
  supportsPublisherDisposal: boolean;
  supportsSubscriberDisposal: boolean;
}

export function defineTransportContract(
  name: string,
  setup: () => Promise<TransportContractSetup>,
  capabilities: TransportContractCapabilities,
): void {
  describe(`${name} transport contract`, () => {
    it('publishes topic, payload, headers, and message identity', async () => {
      await withSetup(setup, async ({ publisher, harness }) => {
        const payload = { id: 'contract-outbound' };
        const headers = {
          'x-contract': 'transport',
          'correlation-id': 'contract-correlation',
        };
        const metadata = { messageId: 'contract-message-id' };

        await publisher.emit('contract.outbound', payload, headers, metadata);

        expect(harness.publishedMessages()).toEqual([
          {
            topic: 'contract.outbound',
            payload,
            headers,
            metadata,
          },
        ]);
      });
    });

    it('propagates publisher errors', async () => {
      await withSetup(setup, async ({ publisher, harness }) => {
        const error = new Error('contract publish failure');
        harness.failNextPublish(error);

        await expect(
          publisher.emit('contract.failure', { id: 'failure' }),
        ).rejects.toBe(error);
      });
    });

    it('registers an inbound handler and propagates delivery metadata', async () => {
      await withSetup(
        setup,
        async ({ subscriber, harness, expectedInboundMetadata }) => {
          const handler = jest.fn().mockResolvedValue(undefined);
          const delivery: TransportContractDelivery = {
            topic: 'contract.inbound',
            group: 'contract-group',
            payload: { id: 'contract-inbound' },
            headers: {
              'x-contract': 'transport',
              'correlation-id': 'contract-correlation',
            },
          };

          await subscriber.consume(delivery.topic, delivery.group, handler);
          await harness.deliver(delivery);

          expect(handler).toHaveBeenCalledTimes(1);
          expect(handler).toHaveBeenCalledWith(
            delivery.payload,
            delivery.headers,
            expectedInboundMetadata,
          );
        },
      );
    });

    it('propagates inbound handler failures to the adapter boundary', async () => {
      await withSetup(setup, async ({ subscriber, harness }) => {
        const error = new Error('contract handler failure');
        await subscriber.consume(
          'contract.inbound',
          'contract-group',
          async () => Promise.reject(error),
        );

        await expect(
          harness.deliver({
            topic: 'contract.inbound',
            group: 'contract-group',
            payload: { id: 'contract-inbound-failure' },
          }),
        ).rejects.toBe(error);
      });
    });

    const publisherInitializationIt =
      capabilities.supportsPublisherInitialization ? it : it.skip;
    publisherInitializationIt(
      'publisher initialization supports repeated lifecycle calls',
      async () => {
        await withSetup(setup, async ({ publisher }) => {
          if (!publisher.initialize) {
            throw new Error(
              'Transport contract capability requires publisher.initialize',
            );
          }
          const options: InitOptions = {
            autoInit: true,
            createQueues: true,
          };

          await expect(publisher.initialize(options)).resolves.toBeUndefined();
          await expect(publisher.initialize(options)).resolves.toBeUndefined();
        });
      },
    );

    const subscriberInitializationIt =
      capabilities.supportsSubscriberInitialization ? it : it.skip;
    subscriberInitializationIt(
      'subscriber initialization supports repeated lifecycle calls',
      async () => {
        await withSetup(setup, async ({ subscriber }) => {
          if (!subscriber.initialize) {
            throw new Error(
              'Transport contract capability requires subscriber.initialize',
            );
          }
          const options: InitOptions = {
            autoInit: true,
            createQueues: true,
          };

          await expect(subscriber.initialize(options)).resolves.toBeUndefined();
          await expect(subscriber.initialize(options)).resolves.toBeUndefined();
        });
      },
    );

    const publisherDisposalIt = capabilities.supportsPublisherDisposal
      ? it
      : it.skip;
    publisherDisposalIt(
      'publisher disposal is repeatable and releases resources',
      async () => {
        await withSetup(setup, async ({ publisher, harness }) => {
          await publisher.emit('contract.cleanup', { id: 'publisher' });
          const activeResources = requireResourceCounter(
            harness.activePublisherResources,
            'activePublisherResources',
          );
          expect(activeResources()).toBeGreaterThan(0);

          if (!publisher.close) {
            throw new Error(
              'Transport contract capability requires publisher.close',
            );
          }
          await expect(publisher.close()).resolves.toBeUndefined();
          await expect(publisher.close()).resolves.toBeUndefined();
          expect(activeResources()).toBe(0);
        });
      },
    );

    const subscriberDisposalIt = capabilities.supportsSubscriberDisposal
      ? it
      : it.skip;
    subscriberDisposalIt(
      'subscriber disposal is repeatable and releases resources',
      async () => {
        await withSetup(setup, async ({ subscriber, harness }) => {
          await subscriber.consume(
            'contract.cleanup',
            'contract-group',
            () => undefined,
          );
          const activeResources = requireResourceCounter(
            harness.activeSubscriberResources,
            'activeSubscriberResources',
          );
          expect(activeResources()).toBeGreaterThan(0);

          if (!subscriber.close) {
            throw new Error(
              'Transport contract capability requires subscriber.close',
            );
          }
          await expect(subscriber.close()).resolves.toBeUndefined();
          await expect(subscriber.close()).resolves.toBeUndefined();
          expect(activeResources()).toBe(0);
        });
      },
    );
  });
}

async function withSetup(
  setup: () => Promise<TransportContractSetup>,
  test: (setup: TransportContractSetup) => Promise<void>,
): Promise<void> {
  const environment = await setup();
  try {
    await test(environment);
  } finally {
    await environment.cleanup();
  }
}

function requireResourceCounter(
  counter: (() => number) | undefined,
  name: string,
): () => number {
  if (!counter) {
    throw new Error(`Transport contract capability requires ${name}`);
  }
  return counter;
}
