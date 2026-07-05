import type { CapHeaders } from '@mikara89/cap-core';
import {
  defineTransportContract,
  type TransportContractPublishedMessage,
} from '@mikara89/cap-testing';
import {
  RabbitMqConfirmTimeoutError,
  RabbitMqDisconnectedError,
} from './rabbitmq-errors';
import { RabbitMqPublisher } from './rabbitmq-publisher';
import { RabbitMqSubscriber } from './rabbitmq-subscriber';
import {
  FakeBroker,
  type FakeConnection,
  type FakeConsumerChannel,
} from '../test/fake-amqp';

const connectionOptions = (broker: FakeBroker) => ({
  connectionFactory: () => Promise.resolve(broker.connection()),
  reconnect: { attempts: 1, initialDelayMs: 0, maxDelayMs: 0 },
});

describe('RabbitMqPublisher', () => {
  it('publishes persistent JSON with CAP identity and broker confirmation', async () => {
    const broker = new FakeBroker();
    const publisher = new RabbitMqPublisher({
      ...connectionOptions(broker),
      namingPrefix: 'dev.',
    });
    await publisher.initialize();

    await publisher.emit(
      'user.created',
      { id: 'u1' },
      { 'x-trace': 'trace-1', 'correlation-id': 'corr-1' },
      { messageId: 'message-1' },
    );

    expect(broker.published).toEqual([
      expect.objectContaining({
        exchange: 'dev.cap',
        topic: 'user.created',
        payload: { id: 'u1' },
        options: expect.objectContaining({
          contentType: 'application/json',
          deliveryMode: 2,
          persistent: true,
          messageId: 'message-1',
          correlationId: 'corr-1',
          mandatory: false,
          headers: {
            'x-trace': 'trace-1',
            'correlation-id': 'corr-1',
          },
        }),
      }),
    ]);
  });

  it('propagates broker nack errors', async () => {
    const broker = new FakeBroker();
    const error = new Error('broker nack');
    broker.failNextPublish = error;
    const publisher = new RabbitMqPublisher(connectionOptions(broker));
    await publisher.initialize();

    await expect(publisher.emit('topic', { ok: false })).rejects.toBe(error);
  });

  it('times out a missing publisher confirmation', async () => {
    const broker = new FakeBroker();
    broker.suppressConfirm = true;
    const publisher = new RabbitMqPublisher({
      ...connectionOptions(broker),
      confirmTimeoutMs: 10,
    });
    await publisher.initialize();

    await expect(
      publisher.emit('topic', { slow: true }),
    ).rejects.toBeInstanceOf(RabbitMqConfirmTimeoutError);
  });

  it('waits for channel drain after backpressure', async () => {
    const broker = new FakeBroker();
    broker.backpressure = true;
    const publisher = new RabbitMqPublisher(connectionOptions(broker));
    await publisher.initialize();
    const result = jest.fn();
    const publishing = publisher.emit('topic', { id: 1 }).then(result);
    await Promise.resolve();
    await Promise.resolve();
    expect(result).not.toHaveBeenCalled();

    [...broker.confirmChannels][0].emit('drain');
    await publishing;
    expect(result).toHaveBeenCalledTimes(1);
  });

  it('fails fast while disconnected and closes idempotently', async () => {
    const broker = new FakeBroker();
    const publisher = new RabbitMqPublisher(connectionOptions(broker));
    await expect(publisher.emit('topic', {})).rejects.toBeInstanceOf(
      RabbitMqDisconnectedError,
    );
    await publisher.initialize();
    await publisher.close();
    await publisher.close();
    expect(broker.confirmChannels.size).toBe(0);
  });

  it('reconnects and restores the exchange after connection close', async () => {
    const broker = new FakeBroker();
    const connections: FakeConnection[] = [];
    const publisher = new RabbitMqPublisher({
      connectionFactory: () => {
        const connection = broker.connection();
        connections.push(connection);
        return Promise.resolve(connection);
      },
      reconnect: { attempts: 1, initialDelayMs: 0, maxDelayMs: 0 },
    });
    await publisher.initialize();
    connections[0].triggerClose();
    await waitFor(() => broker.confirmChannelsCreated === 2);
    await Promise.resolve();

    await expect(
      publisher.emit('topic', { recovered: true }),
    ).resolves.toBeUndefined();
    expect(broker.confirmChannels.size).toBe(1);
    await publisher.close();
  });

  it('rejects an in-flight unconfirmed publish when the connection closes', async () => {
    const broker = new FakeBroker();
    const connection = broker.connection();
    broker.suppressConfirm = true;
    const publisher = new RabbitMqPublisher({
      connectionFactory: () => Promise.resolve(connection),
      confirmTimeoutMs: 1_000,
      reconnect: { attempts: 1, initialDelayMs: 0, maxDelayMs: 0 },
    });
    await publisher.initialize();
    const publishing = publisher.emit('topic', { inFlight: true });
    await Promise.resolve();

    connection.triggerClose();

    await expect(publishing).rejects.toBeInstanceOf(RabbitMqDisconnectedError);
    await publisher.close();
  });

  it('stops an active bounded reconnect loop when closed', async () => {
    const broker = new FakeBroker();
    const firstConnection = broker.connection();
    let attempts = 0;
    const publisher = new RabbitMqPublisher({
      connectionFactory: () => {
        attempts += 1;
        return attempts === 1
          ? Promise.resolve(firstConnection)
          : Promise.reject(new Error('broker unavailable'));
      },
      reconnect: { attempts: 5, initialDelayMs: 50, maxDelayMs: 50 },
    });
    await publisher.initialize();
    firstConnection.triggerClose();
    await waitFor(() => attempts >= 2);

    await publisher.close();
    const attemptsAtClose = attempts;
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(attempts).toBe(attemptsAtClose);
  });
});

describe('RabbitMqSubscriber', () => {
  it('creates durable classic topology, applies prefetch, and acknowledges success', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber({
      ...connectionOptions(broker),
      prefetch: 7,
    });
    const handler = jest.fn().mockResolvedValue(undefined);
    await subscriber.consume('user.created', 'email', handler);
    const channel = currentConsumerChannel(broker);
    const message = broker.message(
      'user.created',
      { id: 'u1' },
      {
        messageId: 'message-1',
      },
    );

    await subscriber.dispatchDelivery('email', message);

    expect(channel.prefetch).toHaveBeenCalledWith(7);
    expect(channel.assertQueue).toHaveBeenCalledWith('cap.email', {
      durable: true,
      exclusive: false,
      autoDelete: false,
      arguments: {},
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      'cap.email',
      'cap',
      'user.created',
    );
    expect(handler).toHaveBeenCalledWith({ id: 'u1' }, undefined, {
      messageId: 'message-1',
      dedupeKey: 'cap/cap.email|message-1',
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('propagates headers, correlation, identity, and redelivery metadata', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber(connectionOptions(broker));
    const handler = jest.fn().mockResolvedValue(undefined);
    await subscriber.consume('orders.*', 'billing', handler);
    await subscriber.dispatchDelivery(
      'billing',
      broker.message(
        'orders.created',
        { id: 'o1' },
        {
          headers: { trace: 'trace-1' },
          correlationId: 'corr-1',
          messageId: 'message-2',
          redelivered: true,
        },
      ),
    );

    expect(handler).toHaveBeenCalledWith(
      { id: 'o1' },
      {
        trace: 'trace-1',
        'correlation-id': 'corr-1',
        'x-cap-rabbitmq-redelivered': true,
      },
      {
        messageId: 'message-2',
        dedupeKey: 'cap/cap.billing|message-2',
      },
    );
  });

  it('nacks handler boundary failures without requeue by default', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber(connectionOptions(broker));
    const error = new Error('inbox persistence failed');
    await subscriber.consume('topic', 'group', () => Promise.reject(error));
    const channel = currentConsumerChannel(broker);
    const message = broker.message('topic', {});

    await expect(subscriber.dispatchDelivery('group', message)).rejects.toBe(
      error,
    );
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
  });

  it('only requeues handler failures when explicitly configured', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber({
      ...connectionOptions(broker),
      requeueOnHandlerError: true,
    });
    await subscriber.consume('topic', 'group', () => {
      throw new Error('temporary failure');
    });
    const channel = currentConsumerChannel(broker);
    const message = broker.message('topic', {});

    await expect(subscriber.dispatchDelivery('group', message)).rejects.toThrow(
      'temporary failure',
    );
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });

  it('never requeues malformed payloads', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber({
      ...connectionOptions(broker),
      requeueOnHandlerError: true,
    });
    await subscriber.consume('topic', 'group', jest.fn());
    const channel = currentConsumerChannel(broker);
    const message = broker.message('topic', undefined, {
      rawContent: Buffer.from('{bad json'),
    });

    await expect(subscriber.dispatchDelivery('group', message)).rejects.toThrow(
      'invalid JSON',
    );
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
  });

  it('configures quorum and dead-letter arguments only when requested', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber({
      ...connectionOptions(broker),
      queueType: 'quorum',
      deadLetterExchange: 'cap.dlx',
      deadLetterRoutingKey: 'cap.dead',
    });
    await subscriber.consume('topic', 'group', jest.fn());

    expect(currentConsumerChannel(broker).assertQueue).toHaveBeenCalledWith(
      'cap.group',
      expect.objectContaining({
        arguments: {
          'x-queue-type': 'quorum',
          'x-dead-letter-exchange': 'cap.dlx',
          'x-dead-letter-routing-key': 'cap.dead',
        },
      }),
    );
  });

  it('cancels consumers and closes resources idempotently', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber(connectionOptions(broker));
    await subscriber.consume('topic', 'group', jest.fn());
    const channel = currentConsumerChannel(broker);

    await subscriber.close();
    await subscriber.close();

    expect(channel.cancel).toHaveBeenCalledWith('consumer-1');
    expect(channel.closed).toBe(true);
    expect(broker.consumerChannels.size).toBe(0);
  });

  it('reconnects and restores queue bindings and consumers', async () => {
    const broker = new FakeBroker();
    const connections: FakeConnection[] = [];
    const subscriber = new RabbitMqSubscriber({
      connectionFactory: () => {
        const connection = broker.connection();
        connections.push(connection);
        return Promise.resolve(connection);
      },
      reconnect: { attempts: 1, initialDelayMs: 0, maxDelayMs: 0 },
    });
    const handler = jest.fn().mockResolvedValue(undefined);
    await subscriber.consume('orders.#.created', 'billing', handler);
    connections[0].triggerClose();
    await waitFor(() => broker.consumerChannelsCreated === 2);
    await Promise.resolve();
    const recoveredChannel = currentConsumerChannel(broker);

    const message = broker.message('orders.eu.created', { id: 1 });
    await subscriber.dispatchDelivery('billing', message);

    expect(recoveredChannel.bindQueue).toHaveBeenCalledWith(
      'cap.billing',
      'cap',
      'orders.#.created',
    );
    expect(recoveredChannel.ack).toHaveBeenCalledWith(message);
    expect(handler).toHaveBeenCalledTimes(1);
    await subscriber.close();
  });

  it('recovers topology after broker consumer cancellation', async () => {
    const broker = new FakeBroker();
    const subscriber = new RabbitMqSubscriber(connectionOptions(broker));
    await subscriber.consume('topic', 'group', jest.fn());

    await subscriber.dispatchDelivery('group', null);
    await waitFor(() =>
      currentConsumerChannel(broker).consumers.has('cap.group'),
    );

    expect(currentConsumerChannel(broker).consumers.has('cap.group')).toBe(
      true,
    );
    await subscriber.close();
  });

  it('stops subscriber reconnect attempts when closed', async () => {
    const broker = new FakeBroker();
    const firstConnection = broker.connection();
    let attempts = 0;
    const subscriber = new RabbitMqSubscriber({
      connectionFactory: () => {
        attempts += 1;
        return attempts === 1
          ? Promise.resolve(firstConnection)
          : Promise.reject(new Error('broker unavailable'));
      },
      reconnect: { attempts: 5, initialDelayMs: 50, maxDelayMs: 50 },
    });
    await subscriber.consume('topic', 'group', jest.fn());
    firstConnection.triggerClose();
    await waitFor(() => attempts >= 2);

    await subscriber.close();
    const attemptsAtClose = attempts;
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(attempts).toBe(attemptsAtClose);
  });
});

defineTransportContract(
  'RabbitMQ',
  async () => {
    const broker = new FakeBroker();
    const publisher = new RabbitMqPublisher(connectionOptions(broker));
    const subscriber = new RabbitMqSubscriber(connectionOptions(broker));
    await publisher.initialize();
    await subscriber.initialize();
    const publishedMessages = (): TransportContractPublishedMessage[] =>
      broker.published.map((message) => ({
        topic: message.topic,
        payload: message.payload,
        headers: message.options.headers as CapHeaders | undefined,
        metadata: message.options.messageId
          ? { messageId: message.options.messageId }
          : undefined,
      }));

    return {
      publisher,
      subscriber,
      harness: {
        publishedMessages,
        failNextPublish: (error: Error) => {
          broker.failNextPublish = error;
        },
        deliver: async ({ topic, group, payload, headers }) =>
          subscriber.dispatchDelivery(
            group,
            broker.message(topic, payload, {
              headers,
              messageId: 'inbound-message-id',
            }),
          ),
        activePublisherResources: () => broker.confirmChannels.size,
        activeSubscriberResources: () => broker.consumerChannels.size,
      },
      expectedInboundMetadata: {
        messageId: 'inbound-message-id',
        dedupeKey: 'cap/cap.contract-group|inbound-message-id',
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

function currentConsumerChannel(broker: FakeBroker): FakeConsumerChannel {
  const channel = [...broker.consumerChannels].at(-1);
  if (!channel) throw new Error('No fake consumer channel');
  return channel;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Timed out waiting for condition');
}
