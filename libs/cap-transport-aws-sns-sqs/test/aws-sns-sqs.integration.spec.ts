import {
  SNSClient,
  PublishCommand,
  CreateTopicCommand,
  SubscribeCommand,
} from '@aws-sdk/client-sns';
import {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
  SendMessageCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';
import { AwsSnsPublisher, AwsSqsSubscriber } from '../src';

jest.setTimeout(180_000);

const LOCALSTACK_PORT = 4566;
const REGION = 'us-east-1';

describe('AWS SNS/SQS transport integration', () => {
  let container: StartedTestContainer;
  let snsClient: SNSClient;
  let sqsClient: SQSClient;
  let endpoint: string;
  let topicArn: string;
  let queueUrl: string;
  const resources: Array<{ close(): Promise<void> }> = [];

  beforeAll(async () => {
    const hostPort = await findFreePort();
    container = await new GenericContainer('localstack/localstack:4.3')
      .withExposedPorts({ container: LOCALSTACK_PORT, host: hostPort })
      .withEnvironment({
        SERVICES: 'sns,sqs',
        AWS_DEFAULT_REGION: REGION,
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
      })
      .withWaitStrategy(
        Wait.forLogMessage(/Ready\./, 1).withStartupTimeout(120_000),
      )
      .start();

    endpoint = `http://${container.getHost()}:${container.getMappedPort(LOCALSTACK_PORT)}`;

    snsClient = new SNSClient({
      region: REGION,
      endpoint,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });

    sqsClient = new SQSClient({
      region: REGION,
      endpoint,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });

    // Create topic
    const topic = await snsClient.send(
      new CreateTopicCommand({ Name: uniqueName('topic', 'roundtrip') }),
    );
    topicArn = topic.TopicArn!;

    // Create queue
    const queue = await sqsClient.send(
      new CreateQueueCommand({ QueueName: uniqueName('queue', 'roundtrip') }),
    );
    queueUrl = queue.QueueUrl!;

    // Get queue ARN and set policy for SNS subscription
    const attrs = await sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      }),
    );
    const queueArn = attrs.Attributes?.['QueueArn'] ?? '';
    if (!queueArn) throw new Error('Could not get queue ARN');
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'sqs:SendMessage',
          Resource: queueArn,
          Condition: {
            ArnEquals: { 'aws:SourceArn': topicArn },
          },
        },
      ],
    });
    await sqsClient.send(
      new SetQueueAttributesCommand({
        QueueUrl: queueUrl,
        Attributes: { Policy: policy },
      }),
    );

    // Create SNS subscription
    await snsClient.send(
      new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'sqs',
        Endpoint: queueArn,
      }),
    );

    // Allow subscription to propagate
    await delay(1_000);
  });

  afterEach(async () => {
    await Promise.allSettled(
      resources.splice(0).map((resource) => resource.close()),
    );
  });

  afterAll(() => {
    snsClient?.destroy();
    sqsClient?.destroy();
    void container?.stop();
  });

  it('publishes to SNS and consumes from SQS with payload, headers, and identity', async () => {
    const publisher = track(new AwsSnsPublisher(localOptions({ topicArn })));
    const subscriber = track(
      new AwsSqsSubscriber(localOptions({ queueUrl, waitTimeSeconds: 5 })),
    );
    const delivered = deferred<unknown>();

    await publisher.initialize();
    await subscriber.consume(
      'orders',
      'billing',
      (payload, headers, metadata) => {
        delivered.resolve({ payload, headers, metadata });
      },
    );

    await publisher.emit(
      'orders',
      { id: 1 },
      { trace: 'trace-1', 'correlation-id': 'corr-1' },
      { messageId: 'message-1' },
    );

    const result = await withDeadline(delivered.promise, 15_000);
    expect(result).toEqual({
      payload: { id: 1 },
      headers: { trace: 'trace-1', 'correlation-id': 'corr-1' },
      metadata: {
        messageId: 'message-1',
        dedupeKey: expect.stringContaining('|message-1'),
      },
    });
  });

  it('does not delete message on handler failure (message returns after visibility timeout)', async () => {
    const shortVisibilityQueue = await createQueue('failure');
    const topicForFailure = topicArn; // reuse

    const subscriber = track(
      new AwsSqsSubscriber(
        localOptions({
          queueUrl: shortVisibilityQueue,
          visibilityTimeout: 3,
          waitTimeSeconds: 2,
        }),
      ),
    );
    let attempts = 0;
    const done = deferred<void>();

    await subscriber.consume('failures', 'recovery', () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('handler failed');
      }
      done.resolve();
    });

    // Publish directly to SNS
    await snsClient.send(
      new PublishCommand({
        TopicArn: topicForFailure,
        Message: JSON.stringify({ id: 'retry' }),
        MessageAttributes: {
          'content-type': {
            DataType: 'String',
            StringValue: 'application/json',
          },
          'cap-message-id': { DataType: 'String', StringValue: 'retry-1' },
        },
      }),
    );

    // Should receive the message again after visibility timeout
    await withDeadline(done.promise, 20_000);
    expect(attempts).toBeGreaterThanOrEqual(2);
    await subscriber.close();
    await cleanupQueue(shortVisibilityQueue);
  });

  it('deletes malformed messages to prevent loops', async () => {
    const malformedQueue = await createQueue('malformed');
    const subscriber = track(
      new AwsSqsSubscriber(
        localOptions({ queueUrl: malformedQueue, waitTimeSeconds: 2 }),
      ),
    );
    const handler = jest.fn();
    await subscriber.consume('malformed', 'cleanup', handler);

    // Send malformed message directly
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: malformedQueue,
        MessageBody: '{bad',
        MessageAttributes: {
          'content-type': {
            DataType: 'String',
            StringValue: 'application/json',
          },
        },
      }),
    );

    await delay(5_000);
    expect(handler).not.toHaveBeenCalled();

    // Verify queue is empty (message was deleted)
    const received = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: malformedQueue,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      }),
    );
    expect(received.Messages).toBeUndefined();

    await subscriber.close();
    await cleanupQueue(malformedQueue);
  });

  it('cleans up publisher and subscriber gracefully', async () => {
    const publisher = new AwsSnsPublisher(localOptions({ topicArn }));
    const subscriber = new AwsSqsSubscriber(
      localOptions({ queueUrl, waitTimeSeconds: 1 }),
    );

    await publisher.initialize();
    await subscriber.consume('cleanup', 'billing', () => undefined);
    await delay(500);
    await expect(publisher.close()).resolves.toBeUndefined();
    await expect(publisher.close()).resolves.toBeUndefined();
    await expect(subscriber.close()).resolves.toBeUndefined();
    await expect(subscriber.close()).resolves.toBeUndefined();
  });

  function localOptions(overrides: Record<string, unknown> = {}) {
    return {
      region: REGION,
      endpoint,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      ...overrides,
    };
  }

  async function createQueue(label: string): Promise<string> {
    const result = await sqsClient.send(
      new CreateQueueCommand({ QueueName: uniqueName('queue', label) }),
    );
    return result.QueueUrl!;
  }

  async function cleanupQueue(url: string): Promise<void> {
    try {
      await sqsClient.send(
        new PurgeQueueCommand({
          QueueUrl: url,
        }),
      );
    } catch {
      // Purge may fail if no messages exist; that's fine
    }
  }

  function track<T extends { close(): Promise<void> }>(resource: T): T {
    resources.push(resource);
    return resource;
  }
});

let seq = 0;
function uniqueName(prefix: string, label: string): string {
  return `cap-${prefix}-${label}-${Date.now()}-${++seq}`;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function withDeadline<T>(
  promise: Promise<T>,
  timeoutMs = 10_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findFreePort(): Promise<number> {
  const net = await import('node:net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Could not find free port'));
      }
    });
  });
}
