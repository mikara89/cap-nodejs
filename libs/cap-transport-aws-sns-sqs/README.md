# @mikara89/cap-transport-aws-sns-sqs

Framework-neutral AWS SNS/SQS transport adapter for CAP Node.js.

## Installation and compatibility

```sh
npm install @mikara89/cap-transport-aws-sns-sqs @mikara89/cap-core
```

Node.js 22 or newer is required. The supported core range starts at
`@mikara89/cap-core@2.2.0`. AWS SDK v3 SNS and SQS clients are runtime
dependencies of this package.

## Client choice

The adapter uses AWS SDK v3 (`@aws-sdk/client-sns` and `@aws-sdk/client-sqs`).
AWS SDK v2 is not supported.

## Usage

```ts
import {
  AwsSnsPublisher,
  AwsSqsSubscriber,
} from '@mikara89/cap-transport-aws-sns-sqs';

const options = {
  region: 'us-east-1',
  topicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
};

const publisher = new AwsSnsPublisher(options);
const subscriber = new AwsSqsSubscriber(options);

await publisher.initialize();
await subscriber.consume('orders.created', 'billing', async (payload) => {
  console.log(payload);
});
await publisher.emit('orders.created', { id: 'order-1' }, undefined, {
  messageId: 'outbox-1',
});

// During graceful shutdown:
await subscriber.close();
await publisher.close();
```

Publish sends JSON payloads to the configured SNS topic with CAP headers as
SNS message attributes. Subscribe polls the configured SQS queue with
long-polling. Messages are deleted from the queue only after the CAP handler
succeeds. Graceful `close()` stops accepting newly received messages, waits for
handlers already in flight and their final delete/non-delete settlement, and
then closes the SQS client. It can therefore wait for a current long poll or
handler to finish.

Standard SQS delivery can be duplicated, so consumers must remain idempotent.
The adapter does not claim exactly-once processing, FIFO ordering on Standard
queues, or cross-system atomicity. CAP owns inbox retries; SQS owns visibility
and redelivery after a handler-boundary failure.

## Configuration

| Option                | Default     | Description                                                           |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| `region`              | `us-east-1` | AWS region                                                            |
| `endpoint`            | -           | Custom endpoint URL (e.g. LocalStack `http://localhost:4566`)         |
| `credentials`         | -           | AWS credentials (accessKeyId, secretAccessKey, optional sessionToken) |
| `topicArn`            | -           | SNS topic ARN                                                         |
| `topicName`           | -           | SNS topic name (for auto-provision)                                   |
| `queueUrl`            | -           | SQS queue URL                                                         |
| `queueName`           | -           | SQS queue name (for auto-provision)                                   |
| `waitTimeSeconds`     | `20`        | SQS long-polling wait time (0-20)                                     |
| `maxNumberOfMessages` | `10`        | Max messages per SQS receive call (1-10)                              |
| `visibilityTimeout`   | `30`        | SQS visibility timeout in seconds                                     |
| `concurrency`         | `1`         | Number of concurrent polling loops                                    |
| `publishTimeoutMs`    | `10000`     | Publish timeout in milliseconds                                       |
| `autoProvision`       | `false`     | Enable automatic SNS/SQS topic/queue creation                         |
| `factory`             | AWS SDK v3  | Custom AWS client factory                                             |
| `logger`              | -           | CAP logger                                                            |

With `autoProvision: false` (the default), operators must provide the SNS topic,
SQS queue, queue policy, and SNS-to-SQS subscription. With `autoProvision: true`,
the adapter uses the configured names to ensure those resources and therefore
needs only the corresponding create/get/set/subscribe permissions. It never
deletes provisioned resources. When updating an existing queue policy, it
preserves unrelated statements and inserts or replaces only a stable CAP-owned
statement for the selected SNS topic. Provisioning fails closed instead of
overwriting a non-empty policy that cannot be parsed safely. One
`AwsSqsSubscriber` instance represents one configured SQS queue and one CAP
topic/group subscription; use a separate queue and subscriber instance for
another subscription so messages cannot be misattributed between logical
topics.

## Dead-Letter Queue and Poison Message Policy

CAP inbox retries remain authoritative. The adapter deletes malformed messages
(content-type mismatch, invalid JSON) immediately to prevent poison-message
loops. Handler failures do not delete the message; they become visible again
after the visibility timeout.

Configure an SQS redrive policy (DLQ) on the queue to catch messages that
exceed `maxReceiveCount`. CAP's inbox retry limits and dead-letter state work
alongside SQS redelivery — they are complementary layers, not replacements.

## LocalStack / Testing

Set `endpoint` to a LocalStack URL when testing against a local AWS emulator:

```ts
const options = {
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  topicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  queueUrl:
    'http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/my-queue',
};

const publisher = new AwsSnsPublisher(options);
const subscriber = new AwsSqsSubscriber(options);
```

The adapter's integration tests use Testcontainers with `localstack/localstack`
for full broker-level verification.

```sh
npm run test:integration:aws-sns-sqs
```
