import type { CapLogger } from '@mikara89/cap-core';
import type {
  CreateTopicCommandOutput,
  SubscribeCommandOutput,
} from '@aws-sdk/client-sns';
import type { CreateQueueCommandOutput } from '@aws-sdk/client-sqs';

/**
 * Optional topology manager for SNS→SQS subscription setup.
 *
 * When `autoProvision` is enabled and topic/queue names are provided
 * (instead of raw ARNs/URLs), this manager can create the SNS topic,
 * SQS queue, and the subscription between them.
 *
 * This is conservative by design:
 * - It only runs when explicitly opted in via `autoProvision: true`.
 * - It only acts on names (not raw ARNs/URLs).
 * - It does not delete resources on close.
 */
export class AwsSnsSqsTopology {
  private readonly created = new Set<string>();

  constructor(private readonly logger?: CapLogger) {}

  async ensureTopic(
    snsClient: {
      send(command: {
        input: { Name: string };
      }): Promise<CreateTopicCommandOutput>;
    },
    topicName: string,
  ): Promise<string> {
    if (this.created.has(`topic:${topicName}`)) {
      return `arn:aws:sns:*:${topicName}`; // approximate; real impl uses returned ARN
    }
    try {
      const result = await snsClient.send({
        input: { Name: topicName },
      });
      const arn = result.TopicArn ?? '';
      this.created.add(`topic:${topicName}`);
      this.logger?.info?.(`Created SNS topic ${arn}`);
      return arn;
    } catch (error) {
      this.logger?.warn?.(`Failed to create SNS topic ${topicName}`, error);
      throw error;
    }
  }

  async ensureQueue(
    sqsClient: {
      send(command: {
        input: { QueueName: string };
      }): Promise<CreateQueueCommandOutput>;
    },
    queueName: string,
  ): Promise<string> {
    if (this.created.has(`queue:${queueName}`)) {
      return `https://sqs.*.amazonaws.com/*/${queueName}`;
    }
    try {
      const result = await sqsClient.send({
        input: { QueueName: queueName },
      });
      const url = result.QueueUrl ?? '';
      this.created.add(`queue:${queueName}`);
      this.logger?.info?.(`Created SQS queue ${url}`);
      return url;
    } catch (error) {
      this.logger?.warn?.(`Failed to create SQS queue ${queueName}`, error);
      throw error;
    }
  }

  async ensureSubscription(
    snsClient: {
      send(command: {
        input: { TopicArn: string; Protocol: string; Endpoint: string };
      }): Promise<SubscribeCommandOutput>;
    },
    topicArn: string,
    queueArn: string,
  ): Promise<void> {
    const key = `sub:${topicArn}->${queueArn}`;
    if (this.created.has(key)) return;
    try {
      await snsClient.send({
        input: {
          TopicArn: topicArn,
          Protocol: 'sqs',
          Endpoint: queueArn,
        },
      });
      this.created.add(key);
      this.logger?.info?.(
        `Created SNS→SQS subscription ${topicArn} -> ${queueArn}`,
      );
    } catch (error) {
      this.logger?.warn?.(
        `Failed to create SNS→SQS subscription ${topicArn} -> ${queueArn}`,
        error,
      );
      throw error;
    }
  }
}
