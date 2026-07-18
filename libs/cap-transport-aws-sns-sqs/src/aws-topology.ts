import { createHash } from 'node:crypto';
import type { CapLogger } from '@mikara89/cap-core';
import type { SnsClient, SqsClient } from './aws-types';

interface QueuePolicyStatement {
  Sid?: string;
  [key: string]: unknown;
}

interface QueuePolicyDocument {
  Statement: QueuePolicyStatement[];
  [key: string]: unknown;
}

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
      input: { QueueUrl: queueUrl, AttributeNames: ['QueueArn', 'Policy'] },
    })) as { Attributes?: Record<string, string> };
    const queueArn = attributes.Attributes?.['QueueArn'];
    if (!queueArn) {
      throw new Error(`AWS SQS did not return an ARN for queue ${queueUrl}`);
    }
    const policy = mergeQueuePolicy(
      attributes.Attributes?.['Policy'],
      topicArn,
      queueArn,
      queueUrl,
    );
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

function mergeQueuePolicy(
  existingPolicy: string | undefined,
  topicArn: string,
  queueArn: string,
  queueUrl: string,
): string {
  const policy = parseQueuePolicy(existingPolicy, queueUrl);
  const sid = capPolicyStatementId(topicArn);
  const statement: QueuePolicyStatement = {
    Sid: sid,
    Effect: 'Allow',
    Principal: { Service: 'sns.amazonaws.com' },
    Action: 'sqs:SendMessage',
    Resource: queueArn,
    Condition: { ArnEquals: { 'aws:SourceArn': topicArn } },
  };
  const ownedIndexes = policy.Statement.flatMap((candidate, index) =>
    candidate.Sid === sid ? [index] : [],
  );
  if (ownedIndexes.length > 1) {
    throw new Error(
      `Cannot safely merge SQS queue policy for ${queueUrl}: duplicate CAP-owned statement ${sid}`,
    );
  }
  const [ownedIndex] = ownedIndexes;
  if (ownedIndex !== undefined) {
    policy.Statement[ownedIndex] = statement;
  } else {
    policy.Statement.push(statement);
  }
  return JSON.stringify(policy);
}

function parseQueuePolicy(
  existingPolicy: string | undefined,
  queueUrl: string,
): QueuePolicyDocument {
  if (!existingPolicy?.trim()) {
    return { Version: '2012-10-17', Statement: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(existingPolicy) as unknown;
  } catch {
    throw unsafePolicyError(queueUrl, 'policy is not valid JSON');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw unsafePolicyError(queueUrl, 'policy must be a JSON object');
  }

  const document = parsed as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(document, 'Statement')) {
    throw unsafePolicyError(queueUrl, 'policy has no Statement');
  }
  const rawStatements = Array.isArray(document.Statement)
    ? document.Statement
    : [document.Statement];
  if (
    rawStatements.some(
      (statement) =>
        statement === null ||
        typeof statement !== 'object' ||
        Array.isArray(statement),
    )
  ) {
    throw unsafePolicyError(queueUrl, 'policy contains a non-object Statement');
  }

  return {
    ...document,
    Statement: rawStatements as QueuePolicyStatement[],
  };
}

function capPolicyStatementId(topicArn: string): string {
  const digest = createHash('sha256')
    .update(topicArn)
    .digest('hex')
    .slice(0, 16);
  return `CapSnsSubscription${digest}`;
}

function unsafePolicyError(queueUrl: string, reason: string): Error {
  return new Error(
    `Cannot safely merge existing SQS queue policy for ${queueUrl}: ${reason}`,
  );
}
