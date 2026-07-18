import type { CapLogger } from '@mikara89/cap-core';
import type { SnsClient, SqsClient } from './aws-types';

/**
 * Opt-in SNS/SQS topology provisioning. Resources are never deleted on close.
 */
export class AwsSnsSqsTopology {
  private readonly topics = new Map<string, string>();
  private readonly queues = new Map<string, string>();
  private readonly subscriptions = new Set<string>();

  constructor(private readonly logger?: CapLogger) {}

  async ensureTopic(snsClient: SnsClient, topicName: string): Promise<string> {
    const existing = this.topics.get(topicName);
    if (existing) return existing;
    const result = (await snsClient.send({
      input: { Name: topicName },
    })) as { TopicArn?: string };
    if (!result.TopicArn) {
      throw new Error(`AWS SNS did not return an ARN for topic ${topicName}`);
    }
    this.topics.set(topicName, result.TopicArn);
    this.logger?.info?.(`Ensured SNS topic ${result.TopicArn}`);
    return result.TopicArn;
  }

  async ensureQueue(sqsClient: SqsClient, queueName: string): Promise<string> {
    const existing = this.queues.get(queueName);
    if (existing) return existing;
    const result = (await sqsClient.send({
      input: { QueueName: queueName },
    })) as { QueueUrl?: string };
    if (!result.QueueUrl) {
      throw new Error(`AWS SQS did not return a URL for queue ${queueName}`);
    }
    this.queues.set(queueName, result.QueueUrl);
    this.logger?.info?.(`Ensured SQS queue ${result.QueueUrl}`);
    return result.QueueUrl;
  }

  async ensureSubscription(
    snsClient: SnsClient,
    sqsClient: SqsClient,
    topicArn: string,
    queueUrl: string,
  ): Promise<void> {
    const key = `${topicArn}->${queueUrl}`;
    if (this.subscriptions.has(key)) return;
    const attributes = (await sqsClient.send({
      input: { QueueUrl: queueUrl, AttributeNames: ['QueueArn'] },
    })) as { Attributes?: Record<string, string> };
    const queueArn = attributes.Attributes?.['QueueArn'];
    if (!queueArn) {
      throw new Error(`AWS SQS did not return an ARN for queue ${queueUrl}`);
    }
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'sns.amazonaws.com' },
          Action: 'sqs:SendMessage',
          Resource: queueArn,
          Condition: { ArnEquals: { 'aws:SourceArn': topicArn } },
        },
      ],
    });
    await sqsClient.send({
      input: {
        QueueUrl: queueUrl,
        Attributes: { Policy: policy },
      },
    });
    await snsClient.send({
      input: { TopicArn: topicArn, Protocol: 'sqs', Endpoint: queueArn },
    });
    this.subscriptions.add(key);
    this.logger?.info?.(
      `Ensured SNS/SQS subscription ${topicArn} -> ${queueArn}`,
    );
  }
}
