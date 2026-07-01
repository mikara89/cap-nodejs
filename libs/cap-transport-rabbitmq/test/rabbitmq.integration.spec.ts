import type { StartedTestContainer } from 'testcontainers';
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
      .withWaitStrategy(Wait.forLogMessage(/Server startup complete/))
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

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error('Timed out waiting for delivery');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
