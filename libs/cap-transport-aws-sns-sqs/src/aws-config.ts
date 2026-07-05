import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import type { AwsClientFactory, AwsCredentials } from './aws-types';
import type { AwsSnsSqsOptions, ResolvedAwsSnsSqsOptions } from './aws-options';

export function resolveAwsSnsSqsOptions(
  options: AwsSnsSqsOptions,
): ResolvedAwsSnsSqsOptions {
  const region = options.region ?? 'us-east-1';
  if (!region.trim()) throw new Error('AWS region must not be empty');

  const topicArn = options.topicArn ?? '';
  if (topicArn && !topicArn.startsWith('arn:aws:sns:')) {
    throw new Error('AWS SNS topic ARN must be a valid SNS topic ARN');
  }

  const queueUrl = options.queueUrl ?? '';
  if (
    queueUrl &&
    !queueUrl.startsWith('https://sqs.') &&
    !queueUrl.startsWith('http://')
  ) {
    throw new Error('AWS SQS queue URL must be a valid SQS queue URL');
  }

  const waitTimeSeconds = options.waitTimeSeconds ?? 20;
  if (
    !Number.isInteger(waitTimeSeconds) ||
    waitTimeSeconds < 0 ||
    waitTimeSeconds > 20
  ) {
    throw new Error(
      'AWS SQS waitTimeSeconds must be an integer between 0 and 20',
    );
  }

  const maxNumberOfMessages = options.maxNumberOfMessages ?? 10;
  if (
    !Number.isInteger(maxNumberOfMessages) ||
    maxNumberOfMessages < 1 ||
    maxNumberOfMessages > 10
  ) {
    throw new Error(
      'AWS SQS maxNumberOfMessages must be an integer between 1 and 10',
    );
  }

  const visibilityTimeout = options.visibilityTimeout ?? 30;
  if (
    !Number.isInteger(visibilityTimeout) ||
    visibilityTimeout <= 0 ||
    visibilityTimeout > 43200
  ) {
    throw new Error(
      'AWS SQS visibilityTimeout must be a positive integer (max 43200)',
    );
  }

  const concurrency = options.concurrency ?? 1;
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error('AWS SQS concurrency must be a positive integer');
  }

  const publishTimeoutMs = options.publishTimeoutMs ?? 10_000;
  if (!Number.isInteger(publishTimeoutMs) || publishTimeoutMs <= 0) {
    throw new Error('AWS SNS publishTimeoutMs must be a positive integer');
  }

  return {
    region,
    credentials: options.credentials,
    topicArn: options.topicArn ?? '',
    queueUrl: options.queueUrl ?? '',
    waitTimeSeconds,
    maxNumberOfMessages,
    visibilityTimeout,
    concurrency,
    publishTimeoutMs,
    autoProvision: options.autoProvision ?? false,
    factory: options.factory ?? defaultAwsFactory,
    logger: options.logger,
  };
}

function defaultAwsFactory(
  region: string,
  credentials?: AwsCredentials,
): AwsClientFactory {
  return {
    snsClient: () => {
      const client = new SNSClient({
        region,
        credentials: credentials
          ? {
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              sessionToken: credentials.sessionToken,
            }
          : undefined,
      });
      return {
        send: async (command) => {
          const cmd = new PublishCommand(command.input);
          return client.send(cmd);
        },
        destroy: () => client.destroy(),
      };
    },
    sqsClient: () => {
      const client = new SQSClient({
        region,
        credentials: credentials
          ? {
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              sessionToken: credentials.sessionToken,
            }
          : undefined,
      });
      return {
        send: async (command) => {
          const input = command.input as Record<string, unknown>;
          const cmd =
            'QueueUrl' in input && 'MaxNumberOfMessages' in input
              ? new ReceiveMessageCommand(input as never)
              : new DeleteMessageCommand(input as never);
          return client.send(cmd as never);
        },
        destroy: () => client.destroy(),
      };
    },
  };
}
