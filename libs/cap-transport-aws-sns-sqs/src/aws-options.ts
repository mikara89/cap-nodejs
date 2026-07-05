import type { CapLogger } from '@mikara89/cap-core';
import type { AwsCredentials, AwsFactory } from './aws-types';

export interface AwsSnsSqsOptions {
  region?: string;
  credentials?: AwsCredentials;
  topicArn?: string;
  topicName?: string;
  queueUrl?: string;
  queueName?: string;
  waitTimeSeconds?: number;
  maxNumberOfMessages?: number;
  visibilityTimeout?: number;
  concurrency?: number;
  publishTimeoutMs?: number;
  autoProvision?: boolean;
  factory?: AwsFactory;
  logger?: CapLogger;
}

export interface ResolvedAwsSnsSqsOptions {
  region: string;
  credentials?: AwsCredentials;
  topicArn: string;
  queueUrl: string;
  waitTimeSeconds: number;
  maxNumberOfMessages: number;
  visibilityTimeout: number;
  concurrency: number;
  publishTimeoutMs: number;
  autoProvision: boolean;
  factory: AwsFactory;
  logger?: CapLogger;
}
