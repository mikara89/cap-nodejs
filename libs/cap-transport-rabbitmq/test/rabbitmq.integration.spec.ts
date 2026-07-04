import type { StartedTestContainer } from 'testcontainers';
import { connect, type Channel, type GetMessage } from 'amqplib';
import type { CapLogger } from '@mikara89/cap-core';
import { RabbitMqPublisher, RabbitMqSubscriber } from '../src';

jest.setTimeout(120_000);

describe('RabbitMQ transport integration', () => {
  let container: StartedTestContainer;
  let url: string;
  const resources: Array<{ close(): Promise<void> }> = [];

  beforeAll(async () => {
    const { GenericContainer, Wait } = await import('testcontainers');
    container = await new GenericContainer('rabbitmq:4.1.0-alpine')
      .withExposedPorts(5672)
      .withWaitStrategy(
        Wait.forLogMessage(/Server startup complete/).withStartupTimeout(
          120_000,
        ),
      )
      .start();
    url = `amqp://guest:guest@${container.getHost()}:${container.getMappedPort(5672)}`;
  });

  afterEach(async () => {
    await Promise.allSettled(
      resources.splice(0).map((resource) => resource.close()),
    );
  });

  afterAll(async () => {
    await container?.stop();
  });

  it('creates topology and completes a confirmed publish/consume round-trip', async () => {
    const prefix = uniquePrefix('roundtrip');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    const subscriber = track(
      new RabbitMqSubscriber({ url, namingPrefix: prefix }),
    );
    const delivery = deferred<{
      payload: unknown;
      headers: unknown;
      metadata: unknown;
    }>();
    await publisher.initialize();
    await subscriber.consume(
      'orders.created',
      'billing',
      (payload, headers, metadata) => {
        delivery.resolve({ payload, headers, metadata });
      },
    );

    await publisher.emit(
      'orders.created',
      { id: 'order-1' },
      { trace: 'trace-1', 'correlation-id': 'corr-1' },
      { messageId: 'message-1' },
    );

    await expect(delivery.promise).resolves.toEqual({
      payload: { id: 'order-1' },
      headers: { trace: 'trace-1', 'correlation-id': 'corr-1' },
      metadata: {
        messageId: 'message-1',
        dedupeKey: `${prefix}cap/${prefix}cap.billing|message-1`,
      },
    });
  });

  it('holds the next delivery until the current handler resolves and is acknowledged', async () => {
    const prefix = uniquePrefix('manual-ack');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    const subscriber = track(
      new RabbitMqSubscriber({ url, namingPrefix: prefix, prefetch: 1 }),
    );
    const releaseFirst = deferred<void>();
    const completed = deferred<void>();
    const received: number[] = [];
    await publisher.initialize();
    await subscriber.consume('jobs.run', 'worker', async (payload) => {
      const id = (payload as { id: number }).id;
      received.push(id);
      if (id === 1) await releaseFirst.promise;
      if (received.length === 2) completed.resolve();
    });

    await publisher.emit('jobs.run', { id: 1 }, undefined, {
      messageId: 'job-1',
    });
    await publisher.emit('jobs.run', { id: 2 }, undefined, {
      messageId: 'job-2',
    });
    await waitFor(() => received.length === 1);
    expect(received).toEqual([1]);
    releaseFirst.resolve();
    await completed.promise;
    expect(received).toEqual([1, 2]);
  });

  it('requeues only when configured and propagates broker redelivery metadata', async () => {
    const prefix = uniquePrefix('redelivery');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    const subscriber = track(
      new RabbitMqSubscriber({
        url,
        namingPrefix: prefix,
        requeueOnHandlerError: true,
      }),
    );
    const delivered = deferred<unknown>();
    let attempts = 0;
    await publisher.initialize();
    await subscriber.consume('retry.me', 'worker', (_payload, headers) => {
      attempts += 1;
      if (attempts === 1) throw new Error('retry once');
      delivered.resolve(headers);
    });
    await publisher.emit('retry.me', { id: 1 }, undefined, {
      messageId: 'retry-message',
    });

    await expect(delivered.promise).resolves.toEqual({
      'x-cap-rabbitmq-redelivered': true,
    });
    expect(attempts).toBe(2);
  });

  it('load-balances competing consumers in one group', async () => {
    const prefix = uniquePrefix('competing');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    const first = track(new RabbitMqSubscriber({ url, namingPrefix: prefix }));
    const second = track(new RabbitMqSubscriber({ url, namingPrefix: prefix }));
    const counts = [0, 0];
    const done = deferred<void>();
    await publisher.initialize();
    await first.consume('work.item', 'workers', () => {
      counts[0] += 1;
      if (counts[0] + counts[1] === 6) done.resolve();
    });
    await second.consume('work.item', 'workers', () => {
      counts[1] += 1;
      if (counts[0] + counts[1] === 6) done.resolve();
    });
    for (let id = 0; id < 6; id += 1) {
      await publisher.emit('work.item', { id }, undefined, {
        messageId: `work-${id}`,
      });
    }

    await done.promise;
    expect(counts[0]).toBeGreaterThan(0);
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[0] + counts[1]).toBe(6);
  });

  it('delivers to every group and obeys topic bindings', async () => {
    const prefix = uniquePrefix('groups');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    const subscriber = track(
      new RabbitMqSubscriber({ url, namingPrefix: prefix }),
    );
    const deliveries: string[] = [];
    const done = deferred<void>();
    await publisher.initialize();
    await subscriber.consume('orders.*', 'billing', () => {
      deliveries.push('billing');
      if (deliveries.length === 2) done.resolve();
    });
    await subscriber.consume('orders.created', 'audit', () => {
      deliveries.push('audit');
      if (deliveries.length === 2) done.resolve();
    });

    await publisher.emit('users.created', { ignored: true }, undefined, {
      messageId: 'ignored',
    });
    await publisher.emit('orders.created', { id: 'order-2' }, undefined, {
      messageId: 'order-2',
    });
    await done.promise;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(deliveries.sort()).toEqual(['audit', 'billing']);
  });

  it('confirms an unroutable publish without claiming routing success and shuts down cleanly', async () => {
    const prefix = uniquePrefix('unbound');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    await publisher.initialize();

    await expect(
      publisher.emit('nothing.bound', { accepted: true }, undefined, {
        messageId: 'unbound-1',
      }),
    ).resolves.toBeUndefined();
    await expect(publisher.close()).resolves.toBeUndefined();
    await expect(publisher.close()).resolves.toBeUndefined();
  });

  it.each(['classic', 'quorum'] as const)(
    'creates and consumes from an explicitly configured %s queue',
    async (queueType) => {
      const prefix = uniquePrefix(queueType);
      const publisher = track(
        new RabbitMqPublisher({ url, namingPrefix: prefix }),
      );
      const subscriber = track(
        new RabbitMqSubscriber({ url, namingPrefix: prefix, queueType }),
      );
      const delivered = deferred<unknown>();
      await publisher.initialize();
      await subscriber.consume('queue.mode', 'workers', (payload) => {
        delivered.resolve(payload);
      });

      await publisher.emit('queue.mode', { queueType }, undefined, {
        messageId: `${queueType}-message`,
      });

      await expect(delivered.promise).resolves.toEqual({ queueType });
    },
  );

  it('dead-letters a default handler failure once instead of requeueing', async () => {
    const prefix = uniquePrefix('dlx-handler');
    const deadLetterExchange = `${prefix}dlx`;
    const deadQueue = `${prefix}dead`;
    const inspector = track(await connect(url));
    const channel = track(await inspector.createChannel());
    await channel.assertExchange(deadLetterExchange, 'topic', {
      durable: true,
    });
    await channel.assertQueue(deadQueue, { durable: true });
    await channel.bindQueue(deadQueue, deadLetterExchange, 'failed');
    const publisher = track(
      new RabbitMqPublisher({ url, namingPrefix: prefix }),
    );
    const subscriber = track(
      new RabbitMqSubscriber({
        url,
        namingPrefix: prefix,
        deadLetterExchange,
        deadLetterRoutingKey: 'failed',
      }),
    );
    let attempts = 0;
    await publisher.initialize();
    await subscriber.consume('handler.failure', 'workers', () => {
      attempts += 1;
      throw new Error('CAP boundary failure');
    });

    await publisher.emit('handler.failure', { id: 1 }, undefined, {
      messageId: 'handler-failure-1',
    });

    const deadLetter = await waitForMessage(channel, deadQueue);
    expect(JSON.parse(deadLetter.content.toString('utf8'))).toEqual({ id: 1 });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(attempts).toBe(1);
    expect(
      (await channel.checkQueue(`${prefix}cap.workers`)).messageCount,
    ).toBe(0);
  });

  it('dead-letters malformed JSON once and never creates a redelivery loop', async () => {
    const prefix = uniquePrefix('dlx-malformed');
    const deadLetterExchange = `${prefix}dlx`;
    const deadQueue = `${prefix}dead`;
    const inspector = track(await connect(url));
    const channel = track(await inspector.createChannel());
    await channel.assertExchange(deadLetterExchange, 'topic', {
      durable: true,
    });
    await channel.assertQueue(deadQueue, { durable: true });
    await channel.bindQueue(deadQueue, deadLetterExchange, 'malformed');
    const subscriber = track(
      new RabbitMqSubscriber({
        url,
        namingPrefix: prefix,
        deadLetterExchange,
        deadLetterRoutingKey: 'malformed',
        requeueOnHandlerError: true,
      }),
    );
    const handler = jest.fn();
    await subscriber.consume('malformed.message', 'workers', handler);

    channel.publish(
      `${prefix}cap`,
      'malformed.message',
      Buffer.from('{not-json', 'utf8'),
      {
        contentType: 'application/json',
        deliveryMode: 2,
        messageId: 'malformed-1',
      },
    );

    const deadLetter = await waitForMessage(channel, deadQueue);
    expect(deadLetter.content.toString('utf8')).toBe('{not-json');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(handler).not.toHaveBeenCalled();
    expect(
      (await channel.checkQueue(`${prefix}cap.workers`)).messageCount,
    ).toBe(0);
    expect((await channel.checkQueue(deadQueue)).messageCount).toBe(0);
  });

  it('fails a publish during broker interruption, reconnects, restores topology, and resumes consumption', async () => {
    const prefix = uniquePrefix('restart');
    const logger: CapLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const reconnect = { attempts: 30, initialDelayMs: 100, maxDelayMs: 500 };
    const publisher = track(
      new RabbitMqPublisher({
        url,
        namingPrefix: prefix,
        reconnect,
        logger,
      }),
    );
    const subscriber = track(
      new RabbitMqSubscriber({
        url,
        namingPrefix: prefix,
        reconnect,
        logger,
      }),
    );
    const delivered = deferred<unknown>();
    await publisher.initialize();
    await subscriber.consume('restart.topic', 'workers', (payload) => {
      delivered.resolve(payload);
    });

    const stopped = await container.exec(['rabbitmqctl', 'stop_app']);
    expect(stopped.exitCode).toBe(0);
    await waitFor(
      () =>
        loggerCalls(logger, 'warn').some((line) =>
          /publisher (connection|channel) closed/u.test(line),
        ),
      30_000,
    );
    await expect(
      publisher.emit('restart.topic', { duringRestart: true }),
    ).rejects.toThrow(/disconnected|confirmation/i);
    const started = await container.exec(['rabbitmqctl', 'start_app']);
    expect(started.exitCode).toBe(0);
    await waitFor(
      () =>
        loggerCalls(logger, 'info').filter((line) =>
          line.includes('publisher connected'),
        ).length >= 2 &&
        loggerCalls(logger, 'info').filter((line) =>
          line.includes('subscriber connected'),
        ).length >= 2,
      30_000,
    );

    await publisher.emit('restart.topic', { afterRestart: true }, undefined, {
      messageId: 'restart-recovered',
    });

    await expect(delivered.promise).resolves.toEqual({ afterRestart: true });
    expect(
      loggerCalls(logger, 'warn').some((line) => line.includes('attempt')),
    ).toBe(true);
  });

  function track<T extends { close(): Promise<void> }>(resource: T): T {
    resources.push(resource);
    return resource;
  }
});

function uniquePrefix(label: string): string {
  return `it.${label}.${Date.now()}.${Math.random().toString(16).slice(2)}.`;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error('Timed out waiting for delivery');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function waitForMessage(
  channel: Channel,
  queue: string,
): Promise<GetMessage> {
  const deadline = Date.now() + 10_000;
  while (Date.now() <= deadline) {
    const message = await channel.get(queue, { noAck: true });
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out waiting for message in ${queue}`);
}

function loggerCalls(logger: CapLogger, level: 'info' | 'warn'): string[] {
  const fn = logger[level] as jest.Mock | undefined;
  return fn?.mock.calls.map(([message]) => String(message)) ?? [];
}
