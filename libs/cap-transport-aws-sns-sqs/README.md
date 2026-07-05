# @mikara89/cap-transport-aws-sns-sqs

Framework-neutral AWS SNS/SQS transport adapter for CAP Node.js.

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
```

Publish sends JSON payloads to the configured SNS topic with CAP headers as
SNS message attributes. Subscribe polls the configured SQS queue with
long-polling. Messages are deleted from the queue only after the CAP handler
succeeds.

## Configuration

| Option               | Default        | Description                                  |
| -------------------- | -------------- | -------------------------------------------- |
| `region`             | `us-east-1`    | AWS region                                   |
| `credentials`        | -              | AWS credentials (accessKeyId, secretAccessKey, optional sessionToken) |
| `topicArn`           | -              | SNS topic ARN                                |
| `topicName`          | -              | SNS topic name (for auto-provision)          |
| `queueUrl`           | -              | SQS queue URL                                |
| `queueName`          | -              | SQS queue name (for auto-provision)          |
| `waitTimeSeconds`    | `20`           | SQS long-polling wait time (0-20)            |
| `maxNumberOfMessages`| `10`           | Max messages per SQS receive call (1-10)     |
| `visibilityTimeout`  | `30`           | SQS visibility timeout in seconds            |
| `concurrency`        | `1`            | Number of concurrent polling loops            |
| `publishTimeoutMs`   | `10000`        | Publish timeout in milliseconds               |
| `autoProvision`      | `false`        | Enable automatic SNS/SQS topic/queue creation |
| `factory`            | AWS SDK v3     | Custom AWS client factory                    |
| `logger`             | -              | CAP logger                                   |

## Dead-Letter Queue and Poison Message Policy

CAP inbox retries remain authoritative. The adapter deletes malformed messages
(content-type mismatch, invalid JSON) immediately to prevent poison-message
loops. Handler failures do not delete the message; they become visible again
after the visibility timeout.

Configure an SQS redrive policy (DLQ) on the queue to catch messages that
exceed `maxReceiveCount`. CAP's inbox retry limits and dead-letter state work
alongside SQS redelivery — they are complementary layers, not replacements.

## Auto-Provisioning

When `autoProvision` is `true` and `topicName`/`queueName` are provided (instead
of raw ARNs/URLs), the adapter can create SNS topics and SQS queues, and set up
SNS→SQS subscriptions. Auto-provisioning is opt-in and conservative: it only
creates, never deletes.
