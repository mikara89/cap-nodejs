import type { PublishCommandInput } from '@aws-sdk/client-sns';

export type { PublishCommandInput };

export interface SnsClient {
  send(command: { input: PublishCommandInput }): Promise<{
    MessageId?: string;
    SequenceNumber?: string;
  }>;
  destroy(): void;
}

export interface SqsClient {
  send(command: { input: unknown }): Promise<unknown>;
  destroy(): void;
}

export interface AwsClientFactory {
  snsClient(
    region: string,
    credentials?: AwsCredentials,
    endpoint?: string,
  ): SnsClient;
  sqsClient(
    region: string,
    credentials?: AwsCredentials,
    endpoint?: string,
  ): SqsClient;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export type AwsFactory = (
  region: string,
  credentials?: AwsCredentials,
  endpoint?: string,
) => AwsClientFactory;
