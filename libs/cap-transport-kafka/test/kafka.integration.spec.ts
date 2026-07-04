import { KafkaJS } from '@confluentinc/kafka-javascript';
import { createServer } from 'node:net';
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';
import { KafkaPublisher, KafkaSubscriber } from '../src';

jest.setTimeout(180_000);

describe('Kafka transport integration', () => {
  let container: StartedTestContainer;
  let brokers: string[];
  const resources: Array<{ close(): Promise<void> }> = [];

  beforeAll(async () => {
    const hostPort = await findFreePort();
    container = await new GenericContainer('apache/kafka:3.9.1')
      .withExposedPorts({ container: 9092, host: hostPort })
      .withEnvironment({
        CLUSTER_ID: '4L6g3nShT-eMCtK--X86sw',
        KAFKA_NODE_ID: '1',
        KAFKA_PROCESS_ROLES: 'broker,controller',
        KAFKA_LISTENERS: 'PLAINTEXT://:9092,CONTROLLER://:9093',
        KAFKA_ADVERTISED_LISTENERS: `PLAINTEXT://localhost:${hostPort}`,
        KAFKA_LISTENER_SECURITY_PROTOCOL_MAP:
          'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT',
        KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER',
        KAFKA_CONTROLLER_QUORUM_VOTERS: '1@localhost:9093',
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
        KAFKA_NUM_PARTITIONS: '3',
        KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '1',
        KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: '1',
        KAFKA_SHARE_COORDINATOR_STATE_TOPIC_REPLICATION_FACTOR: '1',
        KAFKA_SHARE_COORDINATOR_STATE_TOPIC_MIN_ISR: '1',
        KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: '0',
      })
      .withWaitStrategy(Wait.forListeningPorts().withStartupTimeout(180_000))
      .start();
    brokers = [`${container.getHost()}:${container.getMappedPort(9092)}`];
  });

  afterEach(async () => {
    await Promise.allSettled(
      resources.splice(0).map((resource) => resource.close()),
    );
  });

  afterAll(async () => {
    await container?.stop();
  });

  it('publishes and consumes payload, headers, identity, and content type', async () => {
    const topic = uniqueTopic('roundtrip');
    const publisher = track(new KafkaPublisher(kafkaOptions()));
    const subscriber = track(new KafkaSubscriber(kafkaOptions()));
    const delivered = deferred<unknown>();
    await publisher.initialize();
    await subscriber.consume(
      topic,
      uniqueGroup('roundtrip'),
      (payload, headers, metadata) => {
        delivered.resolve({ payload, headers, metadata });
      },
    );
    await publisher.emit(
      topic,
      { id: 1 },
      { trace: 'trace-1', 'correlation-id': 'corr-1' },
      { messageId: 'message-1' },
    );

    await expect(withDeadline(delivered.promise)).resolves.toEqual({
      payload: { id: 1 },
      headers: { trace: 'trace-1', 'correlation-id': 'corr-1' },
      metadata: {
        messageId: 'message-1',
        dedupeKey: expect.stringContaining('|message-1'),
      },
    });
  });

  it('delivers every message to two groups', async () => {
    const topic = uniqueTopic('groups');
    const publisher = track(new KafkaPublisher(kafkaOptions()));
    const subscriber = track(new KafkaSubscriber(kafkaOptions()));
    const received: string[] = [];
    const done = deferred<void>();
    await publisher.initialize();
    for (const group of [uniqueGroup('billing'), uniqueGroup('audit')]) {
      await subscriber.consume(topic, group, () => {
        received.push(group);
        if (received.length === 2) done.resolve();
      });
    }
    await publisher.emit(topic, { id: 1 }, undefined, {
      messageId: 'groups-1',
    });
    await withDeadline(done.promise);
    expect(received).toHaveLength(2);
    expect(new Set(received).size).toBe(2);
  });

  it('load-balances competing consumers in one group without duplicates', async () => {
    const topic = uniqueTopic('competing');
    const group = uniqueGroup('workers');
    const publisher = track(new KafkaPublisher(kafkaOptions()));
    const first = track(new KafkaSubscriber(kafkaOptions()));
    const second = track(new KafkaSubscriber(kafkaOptions()));
    const seen = new Set<number>();
    const counts = [0, 0];
    const done = deferred<void>();
    const handler = (index: number) => (payload: unknown) => {
      const id = (payload as { id: number }).id;
      if (seen.has(id)) throw new Error(`duplicate ${id}`);
      seen.add(id);
      counts[index] += 1;
      if (seen.size === 12) done.resolve();
    };
    await publisher.initialize();
    await first.consume(topic, group, handler(0));
    await second.consume(topic, group, handler(1));
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    for (let id = 0; id < 12; id += 1) {
      await publisher.emit(topic, { id }, undefined, {
        messageId: `work-${id}`,
      });
    }
    await withDeadline(done.promise, 30_000);
    expect(seen.size).toBe(12);
    expect(counts[0] + counts[1]).toBe(12);
  });

  it('does not commit handler failure and redelivers after a new group member starts', async () => {
    const topic = uniqueTopic('failure');
    const group = uniqueGroup('failure');
    const publisher = track(new KafkaPublisher(kafkaOptions()));
    const failing = track(new KafkaSubscriber(kafkaOptions()));
    const failed = deferred<void>();
    await publisher.initialize();
    await failing.consume(topic, group, () => {
      failed.resolve();
      throw new Error('handler failed');
    });
    await publisher.emit(topic, { id: 'retry' }, undefined, {
      messageId: 'retry-1',
    });
    await withDeadline(failed.promise);
    await failing.close();
    const recovered = track(new KafkaSubscriber(kafkaOptions()));
    const delivered = deferred<unknown>();
    await recovered.consume(topic, group, (payload) =>
      delivered.resolve(payload),
    );
    await expect(withDeadline(delivered.promise)).resolves.toEqual({
      id: 'retry',
    });
  });

  it('commits malformed input once so it cannot loop', async () => {
    const topic = uniqueTopic('malformed');
    const group = uniqueGroup('malformed');
    const subscriber = track(new KafkaSubscriber(kafkaOptions()));
    const handler = jest.fn();
    await subscriber.consume(topic, group, handler);
    await rawSend(topic, Buffer.from('{bad'), {
      'content-type': 'application/json',
    });
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await subscriber.close();
    const replacement = track(new KafkaSubscriber(kafkaOptions()));
    await replacement.consume(topic, group, handler);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects producer connection failure and shuts down cleanly', async () => {
    const publisher = new KafkaPublisher({
      brokers: ['127.0.0.1:1'],
      producer: { retry: { retries: 0 } },
    });
    await expect(publisher.initialize()).rejects.toThrow();
    await expect(publisher.close()).resolves.toBeUndefined();

    const healthy = track(new KafkaPublisher(kafkaOptions()));
    const healthySubscriber = track(new KafkaSubscriber(kafkaOptions()));
    await healthy.initialize();
    await healthySubscriber.consume(
      uniqueTopic('shutdown'),
      uniqueGroup('shutdown'),
      () => undefined,
    );
    await expect(healthy.close()).resolves.toBeUndefined();
    await expect(healthy.close()).resolves.toBeUndefined();
    await expect(healthySubscriber.close()).resolves.toBeUndefined();
    await expect(healthySubscriber.close()).resolves.toBeUndefined();
  });

  function kafkaOptions() {
    return {
      brokers,
      autoCreateTopics: true,
      topicCreation: { partitions: 3, replicationFactor: 1 },
      producer: { acks: -1 as const },
    };
  }

  function track<T extends { close(): Promise<void> }>(resource: T): T {
    resources.push(resource);
    return resource;
  }

  async function rawSend(
    topic: string,
    value: Buffer,
    headers: Record<string, string>,
  ): Promise<void> {
    const producer = new KafkaJS.Kafka({
      kafkaJS: { brokers, clientId: 'cap-kafka-malformed-test' },
    }).producer({
      kafkaJS: { allowAutoTopicCreation: false },
    });
    await producer.connect();
    try {
      await producer.send({ topic, messages: [{ value, headers }] });
    } finally {
      await producer.disconnect();
    }
  }
});

function uniqueTopic(label: string): string {
  return `cap.${label}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
}

function uniqueGroup(label: string): string {
  return `cap-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

async function withDeadline<T>(
  promise: Promise<T>,
  timeoutMs = 15_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Timed out waiting for Kafka delivery')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a Kafka host port'));
        return;
      }
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}
